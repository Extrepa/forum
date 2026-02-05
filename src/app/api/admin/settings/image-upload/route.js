import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../../lib/auth';
import { isAdminUser } from '../../../../../lib/admin';
import { setImageUploadsEnabled } from '../../../../../lib/settings';

export async function POST(request) {
  const user = await getSessionUser();
  const redirectUrl = new URL('/admin/moderation', request.url);

  if (!isAdminUser(user)) {
    redirectUrl.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const formData = await request.formData();
  const enabled = String(formData.get('enabled') || '').trim() === '1';

  await setImageUploadsEnabled(enabled);

  redirectUrl.searchParams.set(
    'notice',
    enabled ? 'Image uploads enabled for posts.' : 'Image uploads disabled for posts.'
  );
  return NextResponse.redirect(redirectUrl, 303);
}
