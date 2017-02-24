configured-winston
==================

[![Greenkeeper badge](https://badges.greenkeeper.io/gas-buddy/configured-winston.svg)](https://greenkeeper.io/)

[![wercker status](https://app.wercker.com/status/0c57068422ba008f646fc541d8357308/s/master "wercker status")](https://app.wercker.com/project/byKey/0c57068422ba008f646fc541d8357308)
[![Coverage Status](https://coveralls.io/repos/github/gas-buddy/configured-winston/badge.svg?branch=master)](https://coveralls.io/github/gas-buddy/configured-winston?branch=master)

A wrapper which hooks winston transports up via config. The config entry should have a
"transports" property which has a list of transports to configure. It is specified via
an object rather than array to allow enable/disable and multi-config file overlays (features
of [hydration](https://github.com/gas-buddy/hydration)
 and [confit](https://github.com/krakenjs/confit)) to work more cleanly across environments.

Sample Configuration
====================
```
  "logger": {
    "module": "@gasbuddy/configured-winston",
    "transports": {
      "file": {
        "name": "File",
        "filename": "/var/log/foobar.error.log",
        "config": {
          "level": "error"
        }
      }
    },
    "console": false
  }
```