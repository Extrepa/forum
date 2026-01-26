'use client';

import CollapsibleReplyForm from './CollapsibleReplyForm';

export default function ReplyFormWrapper({ 
  action, 
  buttonLabel = 'Post reply',
  placeholder = 'Share your drip-certified thoughts...',
  labelText = 'What would you like to say?',
  hiddenFields = {},
  replyingTo = null,
  replyPrefill = '',
  allowImageUpload = false
}) {
  return (
    <CollapsibleReplyForm
      action={action}
      buttonLabel={buttonLabel}
      placeholder={placeholder}
      labelText={labelText}
      hiddenFields={hiddenFields}
      replyingTo={replyingTo}
      replyPrefill={replyPrefill}
      allowImageUpload={allowImageUpload}
    />
  );
}
