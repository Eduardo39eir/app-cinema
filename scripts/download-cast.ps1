$ErrorActionPreference = 'Stop'
$actors = Get-Content '.reference/cast-names.json' -Raw -Encoding utf8 | ConvertFrom-Json
$photos = @{}
$sources = Get-Content 'public/assets/sources.json' -Raw -Encoding utf8 | ConvertFrom-Json
foreach ($actor in $actors) {
    $slug = $actor.ToLower().Replace(' ', '-').Replace('.', '')
    $key = "person-$slug"
    $url = 'https://en.wikipedia.org/wiki/' + [Uri]::EscapeDataString($actor.Replace(' ', '_'))
    try {
        $html = (Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 15).Content
        $box = [regex]::Match($html, '(?s)<table[^>]*class="[^"]*infobox.*?</table>').Value
        $src = [regex]::Match($box, '<img[^>]+src="([^"]+)"').Groups[1].Value
        if (-not $src) { throw 'No portrait in infobox' }
        $src = [System.Net.WebUtility]::HtmlDecode($src).Split('?')[0]
        if ($src.StartsWith('//')) { $src = 'https:' + $src }
        Invoke-WebRequest -UseBasicParsing -Uri $src -OutFile "public/assets/$key.jpg" -TimeoutSec 20
        $photos[$actor] = "/assets/$key.jpg"
        $sources | Add-Member -NotePropertyName $key -NotePropertyValue $src -Force
        Write-Output "$actor OK"
    } catch { Write-Output "$actor : portrait unavailable" }
}
$photos | ConvertTo-Json | Set-Content 'src/cast.json' -Encoding utf8
$sources | ConvertTo-Json | Set-Content 'public/assets/sources.json' -Encoding utf8
