import {expect} from 'chai';
import {generateRealm} from '../../src/utils/read-realm-file';
import mockSchema from '../mock/schema';
import mockObjects from '../mock/data';

describe('read-realm-file', () => {
  it('should generate a realm from just schema', async () => {
    const {realm, realmObjects} = await generateRealm(mockSchema, {});
    expect(realmObjects).to.be.an('array').that.is.empty;
    expect(realm.schema)
    .to.be.an('array')
    .that.has.length(3);
    expect(realm.schema[0].properties).have.keys(Object.keys(mockSchema.Ferret.properties));
    realm.close();
  });

  it('should generate a realm from a schema and data', async () => {
    const {realm, realmObjects} = await generateRealm(mockSchema, mockObjects);
    expect(realmObjects).to.be.an('array').that.has.length(6);
    const ferretObjects = realmObjects.filter(o => o.objectSchema().name === 'Ferret');
    const ferretOwner = realmObjects.find(o => o.objectSchema().name === 'FerretOwner');
    const ferretHouse = realmObjects.find(o => o.objectSchema().name === 'House');
    expect(ferretObjects).to.have.length(4);
    expect(ferretOwner).not.to.be.undefined;
    expect(ferretObjects[0].toJSON()).to.have.property('owner').that.deep.equals(ferretOwner!.toJSON());
    expect(ferretHouse).not.to.be.undefined;
    expect(ferretHouse!.toJSON()).to.have.property('ferretsInside')
    .which.is.an('array')
    .that.has.length(2);
    realm.close();
  });
});
