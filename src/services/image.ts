/** Resize event covers before upload to reduce mobile traffic. Falls back to the original file. */
export async function optimizeCover(file:File):Promise<File>{
  if(!/^image\/(jpeg|png|webp|avif)$/.test(file.type))return file;
  if(file.type==='image/avif' && file.size<1_200_000)return file;
  try{
    const bitmap=await createImageBitmap(file);
    const maxW=1600,maxH=1200,scale=Math.min(1,maxW/bitmap.width,maxH/bitmap.height);
    const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    if(scale===1&&file.type==='image/webp'&&file.size<900_000){bitmap.close();return file;}
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx){bitmap.close();return file;}
    ctx.drawImage(bitmap,0,0,width,height);bitmap.close();
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.82));
    if(!blob||blob.size>=file.size&&scale===1)return file;
    const name=(file.name.replace(/\.[^.]+$/,'')||'cover')+'.webp';
    return new File([blob],name,{type:'image/webp',lastModified:Date.now()});
  }catch{return file;}
}
