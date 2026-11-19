"""Signed and encrypted connections with a client certificate and a trusted CA."""

import ipaddress
from datetime import datetime, timedelta, timezone

import pytest
from asyncua import Server, ua
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID
from homeassistant.const import CONF_NAME, CONF_URL

from custom_components.ha_opcua import OpcuaHub
from custom_components.ha_opcua.config_flow import AsyncUAConfigFlow
from custom_components.ha_opcua.connection import connection_attributes
from custom_components.ha_opcua.const import (
    CONF_HUB_CLIENT_CERT,
    CONF_HUB_CLIENT_KEY,
    CONF_HUB_SECURITY_MODE,
    CONF_HUB_SECURITY_POLICY,
    CONF_HUB_SERVER_CA,
)
from custom_components.ha_opcua.security import SecurityConfigError, load_security

SERVER_URI = "urn:test:opcua:server"
CLIENT_URI = "urn:test:homeassistant:client"


def _key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _name(cn):
    return x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, cn)])


def _ca(cn="Test CA"):
    key = _key()
    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(_name(cn))
        .issuer_name(_name(cn))
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=1))
        .not_valid_after(now + timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
        .sign(key, hashes.SHA256())
    )
    return cert, key


def _leaf(ca, uri, cn, *, uri_in_san=True):
    ca_cert, ca_key = ca
    key = _key()
    now = datetime.now(timezone.utc)
    names = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
    ]
    if uri_in_san:
        names.insert(0, x509.UniformResourceIdentifier(uri))
    cert = (
        x509.CertificateBuilder()
        .subject_name(_name(cn))
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=1))
        .not_valid_after(now + timedelta(days=3650))
        .add_extension(x509.SubjectAlternativeName(names), critical=False)
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=True,
                key_encipherment=True,
                data_encipherment=True,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage(
                [ExtendedKeyUsageOID.SERVER_AUTH, ExtendedKeyUsageOID.CLIENT_AUTH]
            ),
            critical=False,
        )
        .sign(ca_key, hashes.SHA256())
    )
    return cert, key


def _write(tmp_path, name, cert=None, key=None, *, pem=True):
    path = tmp_path / name
    if cert is not None:
        encoding = serialization.Encoding.PEM if pem else serialization.Encoding.DER
        path.write_bytes(cert.public_bytes(encoding))
    else:
        path.write_bytes(
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption(),
            )
        )
    return str(path)


@pytest.fixture
def pki(tmp_path):
    ca = _ca()
    client_cert, client_key = _leaf(ca, CLIENT_URI, "ha-client")
    server_cert, server_key = _leaf(ca, SERVER_URI, "plc")
    return {
        "ca": _write(tmp_path, "ca.crt", ca[0]),
        # .crt with PEM content and a DER .der file: format is detected by content.
        "client_cert": _write(tmp_path, "client.crt", client_cert),
        "client_key": _write(tmp_path, "client.key", key=client_key),
        "server_cert": _write(tmp_path, "server.der", server_cert, pem=False),
        "server_key": _write(tmp_path, "server.pem", key=server_key),
        "tmp": tmp_path,
    }


def _settings(pki, **overrides):
    return {
        CONF_HUB_SECURITY_MODE: "SignAndEncrypt",
        CONF_HUB_SECURITY_POLICY: "Aes128Sha256RsaOaep",
        CONF_HUB_CLIENT_CERT: pki["client_cert"],
        CONF_HUB_CLIENT_KEY: pki["client_key"],
        CONF_HUB_SERVER_CA: pki["ca"],
        **overrides,
    }


async def _secure_server(pki, port):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{port}/")
    await server.set_application_uri(SERVER_URI)
    server.set_security_policy(
        [ua.SecurityPolicyType.Aes128Sha256RsaOaep_SignAndEncrypt]
    )
    await server.load_certificate(pki["server_cert"], format="der")
    await server.load_private_key(pki["server_key"], format="pem")
    ns = await server.register_namespace("urn:security-test")
    var = await server.nodes.objects.add_variable(ns, "Value", 21.5)
    await server.start()
    return server, var


def test_none_mode_keeps_the_unsecured_connection():
    assert load_security({}) is None
    assert load_security({CONF_HUB_SECURITY_MODE: "None"}) is None


@pytest.mark.parametrize(
    ("change", "error"),
    [
        ({CONF_HUB_CLIENT_CERT: ""}, "client_certificate_missing"),
        ({CONF_HUB_CLIENT_CERT: "/does/not/exist.crt"}, "client_certificate_missing"),
        ({CONF_HUB_CLIENT_KEY: ""}, "client_key_missing"),
        ({CONF_HUB_SERVER_CA: "/does/not/exist.crt"}, "server_ca_missing"),
        ({CONF_HUB_SECURITY_POLICY: "Basic128Rsa15"}, "invalid_security_policy"),
    ],
)
def test_invalid_settings_are_reported(pki, change, error):
    with pytest.raises(SecurityConfigError, match=error):
        load_security(_settings(pki, **change))


def test_certificate_needs_uri_and_matching_key(pki):
    ca = _ca()
    no_uri, no_uri_key = _leaf(ca, CLIENT_URI, "x", uri_in_san=False)
    path = _write(pki["tmp"], "no-uri.crt", no_uri)
    with pytest.raises(SecurityConfigError, match="client_certificate_no_uri"):
        load_security(_settings(pki, **{CONF_HUB_CLIENT_CERT: path}))

    other_key = _write(pki["tmp"], "other.key", key=no_uri_key)
    with pytest.raises(SecurityConfigError, match="client_key_mismatch"):
        load_security(_settings(pki, **{CONF_HUB_CLIENT_KEY: other_key}))


def test_application_uri_comes_from_the_certificate(pki):
    security = load_security(_settings(pki))
    assert security.application_uri == CLIENT_URI
    assert security.mode is ua.MessageSecurityMode.SignAndEncrypt
    assert len(security.trusted_cas) == 1


async def test_encrypted_connection_reads_values(pki, unused_tcp_port):
    server, var = await _secure_server(pki, unused_tcp_port)
    hub = OpcuaHub(
        "PLC",
        f"opc.tcp://127.0.0.1:{unused_tcp_port}/",
        "i=85",
        security=load_security(_settings(pki)),
    )
    try:
        assert await hub.connect()
        assert hub.client.security_policy.Mode is ua.MessageSecurityMode.SignAndEncrypt
        node = hub.client.get_node(var.nodeid)
        assert await node.read_value() == 21.5
    finally:
        await hub.disconnect(permanent=True)
        await server.stop()


async def test_server_from_another_ca_is_rejected(pki, unused_tcp_port):
    server, _ = await _secure_server(pki, unused_tcp_port)
    foreign_ca = _write(pki["tmp"], "foreign-ca.crt", _ca("Foreign CA")[0])
    hub = OpcuaHub(
        "PLC",
        f"opc.tcp://127.0.0.1:{unused_tcp_port}/",
        "i=85",
        security=load_security(_settings(pki, **{CONF_HUB_SERVER_CA: foreign_ca})),
    )
    try:
        assert not await hub.connect()
        assert not hub.is_connected
        # Rejected by the CA check, not by some unrelated connection failure.
        assert hub.last_error_type == "BadCertificateUntrusted"
    finally:
        await hub.disconnect(permanent=True)
        await server.stop()


async def test_unsecured_client_cannot_reach_a_secured_only_server(
    pki, unused_tcp_port
):
    server, _ = await _secure_server(pki, unused_tcp_port)
    hub = OpcuaHub("PLC", f"opc.tcp://127.0.0.1:{unused_tcp_port}/", "i=85")
    try:
        assert not await hub.connect()
    finally:
        await hub.disconnect(permanent=True)
        await server.stop()


async def test_config_flow_rejects_unusable_certificate_files(hass, pki):
    flow = AsyncUAConfigFlow()
    flow.hass = hass
    flow.context = {"source": "user"}
    result = await flow.async_step_user(
        {
            CONF_NAME: "Secure PLC",
            CONF_URL: "opc.tcp://localhost:4840",
            **_settings(pki, **{CONF_HUB_CLIENT_KEY: "/does/not/exist.key"}),
        }
    )
    assert result["type"] == "form"
    assert result["errors"] == {"base": "client_key_missing"}

    result = await flow.async_step_user(
        {
            CONF_NAME: "Secure PLC",
            CONF_URL: "opc.tcp://localhost:4840",
            **_settings(pki),
        }
    )
    assert result["type"] == "create_entry"
    assert result["data"][CONF_HUB_SECURITY_MODE] == "SignAndEncrypt"
    assert result["data"][CONF_HUB_CLIENT_CERT] == pki["client_cert"]


def test_diagnostics_show_the_active_security(pki):
    hub = OpcuaHub(
        "PLC", "opc.tcp://plc:4840", "i=85", security=load_security(_settings(pki))
    )

    class Coordinator:
        pass

    coordinator = Coordinator()
    coordinator.hub = hub
    coordinator.enabled = True
    coordinator.nodes = {}
    coordinator._platforms = {}
    coordinator.poll_interval = timedelta(seconds=10)
    attrs = connection_attributes(coordinator)
    assert attrs["security_mode"] == "SignAndEncrypt"
    assert attrs["security_policy"] == "Aes128Sha256RsaOaep"
    assert attrs["server_certificate_checked"] is True
