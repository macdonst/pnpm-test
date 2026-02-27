# pnpm-test

## Function log-event

Since `log-event` is now part of the `pnpm-workspace.yaml` file when you run `pnpm install` it adds a `node_modules` folder to `./functions/log-event`.

### Transpilation

Since `functions/log-event/index.ts` is a TypeScript file we need to do transpilation. This creates a new folder `functions/log-event/.build/function-log-event` where the .ts code is transpiled to .js.

### Hydration

When the CLI runs the hydration step it shells out to `pnpm` to install node_modules. If the user has run `pnpm install` at the root folder which creates `functions/log-event/node_modules` the following prompt will be printed:

```bash
pnpm --config.node-linker=hoisted i
Scope: all 2 workspace projects
✔ The modules directory at "./pnpm-test/functions/log-event/node_modules" will be removed and reinstalled from scratch. Proceed? (Y/n) · true
```

This is the root cause of the issue we see intermittently that is reported to the command line as:

```
➜ ../runtime-cli/bin/run.js blueprints deploy
Deploying "Autofoos 3.0" <ST-d45jg133>...
Processing function assets...
× Error: Command failed: pnpm --config.node-linker=hoisted i --prod
Error:
    at genericNodeError (node:internal/errors:983:15)
    at wrappedFn (node:internal/errors:537:14)
    at ChildProcess.exithandler (node:child_process:414:12)
    at ChildProcess.emit (node:events:518:28)
    at maybeClose (node:internal/child_process:1101:16)
    at ChildProcess._handle.onexit (node:internal/child_process:304:5)
  ✖ Failed uploading generate-match-image asset, deploy has stopped
 ›   Error: hydration_error
```

With the root cause being:

```
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY
```

We can get around this by making sure that there is an environment variable `CI=true`.

However, hydration still fails. Setting `CI=true` will remove the `functions/log-event/node_modules` folder. Then `pnpm` uses the `node_modules` at the root of the project.

```
../../../..                              |   +2 +
../../../..                              | Progress: resolved 0, reused 2, downloaded 0, added 2, done
```

Unfortunately, this does not create a `node_modules` folder in `functions/log-event/.build/function-log-event` which is where we need it to be as that is where we need it to be when we deploy the function code.

### Notes

- The mere presence of a `pnpm-workspace.yaml` file seems to screw up hydration. If you revert back to this [commit](https://github.com/macdonst/pnpm-test/commit/9dd2ed821d6b55f33fa63d0742f97e273333fc0d) everything works pretty damn good.

### Unworkable solutions

1. You can't just copy the `node_modules` from `functions/log-event` to `functions/log-event/.build/function-log-event` as `pnpm` uses symlinking.
2. Copying the `pnpm-lock.yaml` file to `functions/log-event/.build/function-log-event` before running hydrate doesn't help either.
