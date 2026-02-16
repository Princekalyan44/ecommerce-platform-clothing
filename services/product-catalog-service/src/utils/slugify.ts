import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export const generateSlug = (text: string, addRandom: boolean = false): string => {
  let slug = slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"`!:@]/g,
  });

  if (addRandom) {
    const shortId = uuidv4().split('-')[0];
    slug = `${slug}-${shortId}`;
  }

  return slug;
};
