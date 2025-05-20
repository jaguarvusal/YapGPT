import { Yapper } from '../models/index.js';

const cleanDB = async (): Promise<void> => {
  try {
    await Yapper.deleteMany({});
    console.log('Yapper collection cleaned.');

  } catch (err) {
    console.error('Error cleaning collections:', err);
    process.exit(1);
  }
};

export default cleanDB;
