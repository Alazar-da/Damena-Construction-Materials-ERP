'use server';
import { cookies } from 'next/headers'; import { redirect } from 'next/navigation'; import { revalidatePath } from 'next/cache';
export async function setLocale(formData:FormData){const locale=String(formData.get('locale'))==='en'?'en':'am';(await cookies()).set('damena-locale',locale,{httpOnly:false,maxAge:31536000,path:'/'});revalidatePath('/app','layout');redirect('/app');}
