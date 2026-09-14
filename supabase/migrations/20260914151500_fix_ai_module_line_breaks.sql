-- Convert one literal backslash followed by n into an actual line break.
update public.training_modules
set content_text = replace(content_text, chr(92) || 'n', chr(10))
where training_type = 'ai'
  and position(chr(92) || 'n' in content_text) > 0;

update public.training_modules
set trainer_guidance = replace(trainer_guidance, chr(92) || 'n', chr(10))
where training_type = 'ai'
  and position(chr(92) || 'n' in trainer_guidance) > 0;
