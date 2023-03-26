import {Args, Command, Flags} from '@oclif/core';
import {generateRealmFromJSON} from '../../utils';

export default class From extends Command {
  static description = `
  Generate a realm file from a schema file and data file.
  `

  static examples = [
    '$ generate-realm from schemas.json',
    '$ generate-realm from schemas.json --out out.realm',
    '$ generate-realm from schemas.json --data-from data.json --out out.realm',
  ];

  static flags = {
    out: Flags.string({char: 'o', description: 'Path to the output realm', required: false, default: 'out.realm'}),
  }

  static args = {
    'schema-path': Args.string({description: 'JSON file supplying the Realm schema', required: true}),
    'data-path': Args.string({description: 'JSON file supplying the Realm data.'}),
  }

  async run(): Promise<void> {
    const {args: {'schema-path': schemaPath, 'data-path': dataPath}, flags: {out}} = await this.parse(From);

    const status = await generateRealmFromJSON(schemaPath, dataPath, out);

    if (status.success && status.createdObjectCount === 0) {
      this.log(`Generated an output file at ${out}`);
    } else if (status.success) {
      this.log(`Generated an output file at ${out} with ${status.createdObjectCount} objects generated`);
    } else {
      this.error(`Object generation failed with error: ${status.error}`);
    }

    this.exit();
  }
}
