# Clear Jargon Script
# This script loads a hard‑coded mapping of jargon → replacement (including deletions)
# and applies safe replacements only inside string literals ("…" or `…`) and comments.
# It does NOT modify identifiers or type names.

# Define the workspace root
$Root = "c:/Users/LeNoVo/Documents/GRO10X Business/GroUp Academy"

# Jargon mapping (as defined in .lovable/v0.5-jargon-glossary.md)
# Replacement of "(delete)" means remove the term.
$map = @{
    "Verifying Core Clearance Tokens" = "Signing you in"
    "Initializing…" = "Getting things ready"
    "Initialize Synthesis Pipeline" = "Getting things ready"
    "Core Boot" = "Loading"
    "Core Sync" = "Loading"
    "Telemetry sync" = ""
    "Verified Mastery Sync v2.6.4" = ""
    "Protocol:" = ""
    "Logic Node Fault" = "Something went wrong"
    "Node Failure" = "Couldn't load"
    "Anomaly detected" = "We hit a snag"
    "Telemetry sync error. Admin agents notified." = "We hit a snag. Our team has been notified."
    "Reasoning Pipeline error" = "Something went wrong"
    "Cognitive Layer" = ""
    "Cognitive Core" = ""
    "Executive Logic" = ""
    "HUD" = "dashboard"
    "Phase 4.5" = ""
    "Phase J2" = ""
    "Synthesis" = "summary"
    "Synthetic" = "generated"
    "Sentinel" = "guard"
}

function Replace-InFile([string]$path) {
    $content = Get-Content -Raw -Path $path
    $newContent = $content
    foreach ($jargon in $map.Keys) {
        $replacement = $map[$jargon]
        $escaped = [regex]::Escape($jargon)
        # Replace in string literals (double‑quoted and back‑ticked) and comments only
        $pattern = "(?<comment>//.*$escaped.*|/\*.*?$escaped.*?\*/)|(?<dblquote>\"[^\"]*$escaped[^\"]*\")|(?<backquote>`[^`]*$escaped[^`]*`)
"
        $newContent = [regex]::Replace($newContent, $pattern, {
            param($m)
            if ($m.Groups[\"comment\"].Success) {
                return $m.Value -replace $escaped, $replacement
            } elseif ($m.Groups[\"dblquote\"].Success) {
                return $m.Value -replace $escaped, $replacement
            } elseif ($m.Groups[\"backquote\"].Success) {
                return $m.Value -replace $escaped, $replacement
            } else { return $m.Value }
        })
    }
    if ($newContent -ne $content) {
        Set-Content -Path $path -Value $newContent -Encoding utf8
        Write-Host "Edited $path"
    }
}

Get-ChildItem -Path $Root -Recurse -Include *.tsx,*.ts | ForEach-Object { Replace-InFile $_.FullName }
