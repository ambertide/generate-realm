export default {
  FerretOwner: [
    {
      _id: '000000000000000000000000',
      name: 'John Doe',
      ownedFerrets: 5,
    },
  ],
  Ferret: [
    {
      _id: '000000000000000000000000',
      name: 'Dooky',
      owner: '000000000000000000000000',
    },
    {
      _id: '000000000000000000000001',
      name: 'Dooksville',
      owner: '000000000000000000000000',
    },
    {
      _id: '000000000000000000000002',
      name: 'DookyDook',
      owner: '000000000000000000000000',
    },
    {
      _id: '000000000000000000000003',
      name: 'DookDook',
      owner: '000000000000000000000000',
    },
  ],
  House: [
    {
      _id: '000000000000000000000000',
      ferretsInside: ['000000000000000000000000', '000000000000000000000001'],
    },
  ],
};
