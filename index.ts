interface Command {
  type: string;
  args: any;
}

export interface CopyFlags {
  followSymlinks: boolean; //true,
  copyDirContentsOnly: boolean; //true,
  attemptUnpack: boolean; //false,
  createDestPath: boolean; //true,
  allowWildcard: boolean; //true,
  allowEmptyWildcard: boolean; //true,
}

export interface CopyOptions {
  from?: Stage;
  source: string;
  destination: string;
  opts?: CopyFlags;
}

export interface RunMount {
  target: string;
  type?: "cache" | "bind" | "tmpfs" | "secret" | "ssh";
  network?: "none" | "host" | "default";
}

export class Stage {
  private base: string;
  private name: string;
  private commands: Command[];

  constructor(name: string, base: string) {
    this.base = base;
    this.name = name;
    this.commands = [];
  }

  run(command: string, opts?: RunMount[]): this {
    this.commands.push({
      type: "run",
      args: {
        command,
        mounts: opts,
      },
    });
    return this;
  }

  env(key: string, value: string): this {
    this.commands.push({ type: "env", args: { key, value } });
    return this;
  }

  copy(opts: CopyOptions): this {
    this.commands.push({ type: "copy", args: opts });
    return this;
  }

  merge(stages: Stage[]): this {
    this.commands.push({ type: "merge", args: stages });
    return this;
  }

  entrypoint(command: string[]): this {
    this.commands.push({ type: "entrypoint", args: command });
    return this;
  }

  label(key: string, value: string): this {
    this.commands.push({ type: "label", args: { key, value } });
    return this;
  }

  workdir(dir: string): this {
    this.commands.push({ type: "workdir", args: dir });
    return this;
  }

  chdir(dir: string): this {
    this.commands.push({ type: "chdir", args: dir });
    return this;
  }

  build(): any {
    return {
      base: this.base,
      name: this.name,
      commands: this.commands,
    };
  }
}

/**
 * Helper class to create a Ubuntu stage
 */
export class Ubuntu extends Stage {
  private aptUpdate = false;

  /**
   *
   * @param name The name of the stage
   * @param tag The tag to use for this stage
   */
  constructor(name: string, tag = "latest") {
    super(name, `ubuntu:${tag}`);
  }

  /**
   * Install one or more packages
   *
   * Note: if a package should be installed this automatically runs `apt update --fix-missing` for you
   *
   * @param packages packages to install
   * @returns
   */
  install(...packages: string[]): this {
    if (!this.aptUpdate) {
      this.run("apt update --fix-missing");
      this.aptUpdate = true;
    }
    this.run(`apt install -y ${packages.join(" ")}`);

    return this;
  }
}