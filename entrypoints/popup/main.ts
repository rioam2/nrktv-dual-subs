import { demoSrc } from './demo';

const demoImg = document.createElement('img');
demoImg.src = demoSrc;
demoImg.style.width = '100%';
demoImg.style.height = 'auto';
demoImg.style.borderRadius = '8px';
demoImg.style.margin = '16px 0';
demoImg.style.border = '0.5px solid #ccc';

document.getElementById('root')?.appendChild(demoImg);
