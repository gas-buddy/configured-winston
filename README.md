configured-winston
==================

A wrapper which hooks winston transports up via config. The config entry should have a
"transports" property which has a list of transports to configure. It is specified via
an object rather than array to allow enable/disable and multi-config file overlays (features
of [hydration](https://github.com/gas-buddy/hydration)
 and [confit](https://github.com/krakenjs/confit)) to work more cleanly across environments.
