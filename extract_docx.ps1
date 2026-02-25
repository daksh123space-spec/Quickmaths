Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText {
    param($Path)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $entry = $zip.GetEntry('word/document.xml')
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $text = $xml -replace '<[^>]+>', ' '
    $text = ($text -replace '\s+', ' ').Trim()
    return $text
}

$t = Get-DocxText "Math Lessons Documents PP.docx"
$t | Out-File -FilePath "lessons_text.txt" -Encoding UTF8
Write-Output "Done. Length: $($t.Length)"
