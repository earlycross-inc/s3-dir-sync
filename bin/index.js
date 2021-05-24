#!/usr/bin/env node
'use strict';

require('../lib/Cli')
  .cli()
  .catch(e => console.error(e));
