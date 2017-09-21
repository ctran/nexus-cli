[![Build Status](https://travis-ci.org/ctran/nexus-cli.svg?branch=master)](https://travis-ci.org/ctran/nexus-cli)

# nexus-cli
Set up credentials to access Nexus 2.x repository


  Usage: nexus [options] [command]


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    login [options] <url>  set up ~/.npmrc file to access a Nexus repository

  Examples:

    $ nexus login http://localhost:8081/nexus/content/groups/npm-all

node index.js login --help

  Usage: login [options] <url>

  set up ~/.npmrc file to access a Nexus repository


  Options:

    -u, --username <username>  The user to authenticate as
    -p, --password <password>  The user's password
    -e, --email <email>        The user's email
    --scope <scope>
    --always-auth
    -h, --help                 output usage information
