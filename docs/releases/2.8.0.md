# OPC UA Connect 2.8.0

This release adds signed and encrypted connections with client certificates.

## Secure connection with certificates

- New endpoint settings in setup and **Configure → Connection**: security mode (`None`, `Sign`, `SignAndEncrypt`), security policy (`Aes128Sha256RsaOaep`, `Basic256Sha256`, `Aes256Sha256RsaPss`) and file paths for the client certificate, its private key and the server CA certificate.
- The ApplicationUri of the session is taken from the `URI` entry of the client certificate, so the server's URI check passes.
- With a server CA set, the server certificate is accepted only if it is issued directly by that CA and one of its `URI` entries equals the server's ApplicationUri.
- Before saving, the form checks that the files exist and parse, that the client certificate has a `URI` entry and that key and certificate match. Invalid security settings stop the endpoint with a clear error instead of retrying.
- Connection diagnostics show the security mode and policy in use.

Certificates and keys may be PEM or DER; the key must not be password protected. See the README section *Secure connection with certificates* for the certificate requirements and a setup guide for CODESYS 3.5 servers (e.g. WAGO PFC200).

## Updating from 2.7.0

Update the integration and restart Home Assistant. The integration should display **2.8.0**.

Existing endpoints keep security mode `None` and are not changed. To switch an endpoint, copy the certificate files to the Home Assistant host, then set mode, policy and paths under **Configure → Connection**. Once a server enforces certificates it may stop offering `None`, so switch the endpoint right after the server change.
