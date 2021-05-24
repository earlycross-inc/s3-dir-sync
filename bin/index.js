#!/usr/bin/env node
'use strict';

require('../dist/Cli')
  .cli()
  .catch(e => console.error(e));
