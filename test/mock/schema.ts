export default {
  FerretOwner: {
    name: 'FerretOwner',
    properties: {
      _id: 'objectId',
      name: 'string',
      ownedFerrets: 'int',
    },
    primaryKey: '_id',
  },
  Ferret: {
    name: 'Ferret',
    properties: {
      _id: 'objectId',
      name: 'string',
      owner: 'FerretOwner',
    },
    primaryKey: '_id',
  },
};
