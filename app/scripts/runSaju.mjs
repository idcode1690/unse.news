import { calculateSaju } from '../src/utils/sajooCalculator.jsx';

const res = calculateSaju(1980, 2, 11, 13, 10, { calendar: 'lunar' });
console.log(JSON.stringify(res, null, 2));
