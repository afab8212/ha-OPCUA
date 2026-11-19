"""Signed/encrypted OPC UA connections with a client certificate.

Files are read once in an executor (blocking I/O) and handed to asyncua as
bytes. The server certificate is accepted only when a configured CA issued it.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from asyncua import ua
from asyncua.common.utils import ServiceError
from asyncua.crypto import security_policies
from asyncua.crypto.uacrypto import CertProperties
from cryptography import x509
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization

from .const import (
    CONF_HUB_CLIENT_CERT,
    CONF_HUB_CLIENT_KEY,
    CONF_HUB_SECURITY_MODE,
    CONF_HUB_SECURITY_POLICY,
    CONF_HUB_SERVER_CA,
    DEFAULT_SECURITY_MODE,
    DEFAULT_SECURITY_POLICY,
)

SECURITY_MODES = ["None", "Sign", "SignAndEncrypt"]
SECURITY_POLICIES = {
    "Basic256Sha256": security_policies.SecurityPolicyBasic256Sha256,
    "Aes128Sha256RsaOaep": security_policies.SecurityPolicyAes128Sha256RsaOaep,
    "Aes256Sha256RsaPss": security_policies.SecurityPolicyAes256Sha256RsaPss,
}


class SecurityConfigError(ValueError):
    """Invalid security settings; the message is a translation error key."""


@dataclass(frozen=True)
class SecurityConfig:
    policy: type
    mode: ua.MessageSecurityMode
    certificate: CertProperties
    private_key: CertProperties
    application_uri: str
    trusted_cas: list[x509.Certificate] = field(default_factory=list)

    @property
    def mode_name(self) -> str:
        return self.mode.name


def _is_pem(content: bytes) -> bool:
    return b"-----BEGIN" in content


def _read(path: str | None, missing: str) -> bytes:
    if not path or not path.strip():
        raise SecurityConfigError(missing)
    try:
        return Path(path.strip()).read_bytes()
    except OSError as err:
        raise SecurityConfigError(missing) from err


def _load_certificate(content: bytes) -> x509.Certificate:
    if _is_pem(content):
        return x509.load_pem_x509_certificate(content)
    return x509.load_der_x509_certificate(content)


def load_security(settings: dict) -> SecurityConfig | None:
    """Read and check the configured files; None means an unsecured connection.

    Blocking: call from an executor.
    """
    mode_name = settings.get(CONF_HUB_SECURITY_MODE) or DEFAULT_SECURITY_MODE
    if mode_name == "None":
        return None
    if mode_name not in SECURITY_MODES:
        raise SecurityConfigError("invalid_security_mode")
    policy_name = settings.get(CONF_HUB_SECURITY_POLICY) or DEFAULT_SECURITY_POLICY
    if policy_name not in SECURITY_POLICIES:
        raise SecurityConfigError("invalid_security_policy")

    cert_bytes = _read(settings.get(CONF_HUB_CLIENT_CERT), "client_certificate_missing")
    try:
        certificate = _load_certificate(cert_bytes)
    except ValueError as err:
        raise SecurityConfigError("client_certificate_invalid") from err
    try:
        san = certificate.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        )
        uris = san.value.get_values_for_type(x509.UniformResourceIdentifier)
    except x509.ExtensionNotFound:
        uris = []
    if not uris:
        # The server compares the session's ApplicationUri with this field.
        raise SecurityConfigError("client_certificate_no_uri")

    key_bytes = _read(settings.get(CONF_HUB_CLIENT_KEY), "client_key_missing")
    try:
        if _is_pem(key_bytes):
            key = serialization.load_pem_private_key(key_bytes, password=None)
        else:
            key = serialization.load_der_private_key(key_bytes, password=None)
    except (ValueError, TypeError) as err:
        # TypeError: the key is password protected.
        raise SecurityConfigError("client_key_invalid") from err
    if key.public_key().public_numbers() != certificate.public_key().public_numbers():
        raise SecurityConfigError("client_key_mismatch")

    trusted_cas: list[x509.Certificate] = []
    ca_path = settings.get(CONF_HUB_SERVER_CA)
    if ca_path and ca_path.strip():
        ca_bytes = _read(ca_path, "server_ca_missing")
        try:
            if _is_pem(ca_bytes):
                trusted_cas = x509.load_pem_x509_certificates(ca_bytes)
            else:
                trusted_cas = [x509.load_der_x509_certificate(ca_bytes)]
        except ValueError as err:
            raise SecurityConfigError("server_ca_invalid") from err

    return SecurityConfig(
        policy=SECURITY_POLICIES[policy_name],
        mode=getattr(ua.MessageSecurityMode, mode_name),
        certificate=CertProperties(
            certificate.public_bytes(serialization.Encoding.DER), extension="der"
        ),
        private_key=CertProperties(
            key.private_bytes(
                serialization.Encoding.DER,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            ),
            extension="der",
        ),
        application_uri=uris[0],
        trusted_cas=trusted_cas,
    )


def server_certificate_validator(trusted_cas: list[x509.Certificate]):
    """Accept only server certificates that are valid now and issued by a trusted CA."""

    async def validate(cert: x509.Certificate, app_description) -> None:
        now = datetime.now(timezone.utc)
        if not cert.not_valid_before_utc <= now <= cert.not_valid_after_utc:
            raise ServiceError(ua.StatusCodes.BadCertificateTimeInvalid)
        for ca in trusted_cas:
            try:
                cert.verify_directly_issued_by(ca)
            except (ValueError, TypeError, InvalidSignature):
                continue
            if not ca.not_valid_before_utc <= now <= ca.not_valid_after_utc:
                raise ServiceError(ua.StatusCodes.BadCertificateIssuerTimeInvalid)
            break
        else:
            raise ServiceError(ua.StatusCodes.BadCertificateUntrusted)
        try:
            san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
            uris = san.value.get_values_for_type(x509.UniformResourceIdentifier)
        except x509.ExtensionNotFound:
            uris = []
        if app_description.ApplicationUri not in uris:
            raise ServiceError(ua.StatusCodes.BadCertificateUriInvalid)

    return validate


async def apply_security(client, security: SecurityConfig) -> None:
    """Configure a fresh asyncua client before connect()."""
    client.application_uri = security.application_uri
    await client.set_security(
        security.policy,
        security.certificate,
        security.private_key,
        mode=security.mode,
    )
    if security.trusted_cas:
        client.certificate_validator = server_certificate_validator(
            security.trusted_cas
        )
