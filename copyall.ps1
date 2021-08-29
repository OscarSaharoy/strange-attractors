
(Select-String -Pattern 'js\/.*\.js' strange-attractors.html) | ForEach-Object -Process {get-content $_.Matches.Value} | clip
