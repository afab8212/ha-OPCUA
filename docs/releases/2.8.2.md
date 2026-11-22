# OPC UA Connect 2.8.2

This release stops the connection status sensor from flooding the recorder database.

## Fixed

- The connection status binary sensor carried `last_successful_read` as a state attribute. That timestamp changes on every poll and every subscription update, so Home Assistant recorded a new state row about every second although the connection state itself did not change (more than 100,000 rows per day for one endpoint). The attribute is no longer part of the entity state; it is still included in the integration's diagnostics download.

## Updating from 2.8.1

Update the integration and restart Home Assistant. The integration should display **2.8.2**. Automations or templates that read `last_successful_read` from the connection sensor need to be adjusted. A recorder exclusion added for the connection sensor as a workaround can be removed.
