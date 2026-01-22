'use client';

import CollapsibleCommentForm from './CollapsibleCommentForm';

export default function CommentFormWrapper({ 
  action, 
  buttonLabel = 'Post comment',
  placeholder = 'Drop your thoughts into the goo...',
  labelText = 'What would you like to say?',
  hiddenFields = {}
}) {
  return (
    <CollapsibleCommentForm
      action={action}
      buttonLabel={buttonLabel}
      placeholder={placeholder}
      labelText={labelText}
      hiddenFields={hiddenFields}
    />
  );
}
