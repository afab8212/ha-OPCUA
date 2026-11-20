# OPC UA Connect 2.8.1

This release stops spurious disconnects from busy OPC UA servers.

## Fixed

- asyncua's connection supervisor checks the server status every second and treated an answer slower than one second as a lost connection. Heavily loaded PLCs (e.g. a single-core WAGO PFC200 running CODESYS 3.5 with a web visualisation at full CPU) sometimes answer later than that, so the endpoint dropped its session and subscription and stayed without values until the next poll. The check now runs every 10 seconds and waits up to 10 seconds (at most half the session timeout) before declaring the connection lost.

## Updating from 2.8.0

Update the integration and restart Home Assistant. The integration should display **2.8.1**. No configuration changes are needed.
