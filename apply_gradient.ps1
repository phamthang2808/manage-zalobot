$f = 'd:\bot_zalo\admin-frontend\src\index.css'
$c = [System.IO.File]::ReadAllText($f)
$c = $c.Replace('#f97316', '#FF8800')
$c = $c.Replace('#ea580c', '#FF5500')
$c = $c.Replace('#c2410c', '#E03300')
$c = $c.Replace('#fed7aa', '#FFE0A0')
$c = $c.Replace('#fff7ed', '#FFF8E8')
$c = $c.Replace('#fdba74', '#FFD070')
$c = $c.Replace('rgba(249, 115, 22,', 'rgba(255, 119, 0,')
$c = $c.Replace('rgba(249,115,22,', 'rgba(255,119,0,')
$c = $c.Replace('rgba(234, 88, 12,', 'rgba(255, 85, 0,')
[System.IO.File]::WriteAllText($f, $c)

$f2 = 'd:\bot_zalo\admin-frontend\src\App.jsx'
$c2 = [System.IO.File]::ReadAllText($f2)
$c2 = $c2.Replace('#f97316', '#FF8800')
$c2 = $c2.Replace('#ea580c', '#FF5500')
$c2 = $c2.Replace('#c2410c', '#E03300')
$c2 = $c2.Replace("'#f97316'", "'#FF8800'")
$c2 = $c2.Replace("'#ea580c'", "'#FF5500'")
$c2 = $c2.Replace('rgba(249, 115, 22,', 'rgba(255, 119, 0,')
$c2 = $c2.Replace('rgba(249,115,22,', 'rgba(255,119,0,')
$c2 = $c2.Replace('rgba(234, 88, 12,', 'rgba(255, 85, 0,')
$c2 = $c2.Replace('linear-gradient(135deg, #f97316', 'linear-gradient(90deg, #FFAA00 0%, #FF5500')
$c2 = $c2.Replace('linear-gradient(135deg, #ea580c', 'linear-gradient(90deg, #FF8800 0%, #E03300')
[System.IO.File]::WriteAllText($f2, $c2)

Write-Host "Done applying gradient colors"
