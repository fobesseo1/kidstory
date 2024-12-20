# UTF-8 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8

# 파일 저장 경로 설정
$outputPath = "C:\Users\$env:USERNAME\Desktop\code_documentation.txt"

# 검색할 파일 확장자 설정
$extensions = @("*.tsx", "*.ts", "*.js", "*.jsx", "*.html", "*.css", "*.json")

# 결과를 저장할 파일 생성 (UTF-8 인코딩 적용)
[System.IO.File]::WriteAllText($outputPath, "Code Documentation`r`n==================`r`n", [System.Text.Encoding]::UTF8)

# 각 파일 처리
foreach ($ext in $extensions) {
    Get-ChildItem -Path $PWD -Filter $ext -Recurse | ForEach-Object {
        # 파일 구분선 추가
        $content = "`r`n=======================================`r`n"
        $content += "File: $($_.FullName)`r`n"
        $content += "=======================================`r`n"
        
        # 파일 내용 읽기 (UTF-8로 읽기)
        $fileContent = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
        $content += $fileContent
        
        # 파일에 추가 (UTF-8 유지)
        [System.IO.File]::AppendAllText($outputPath, $content, [System.Text.Encoding]::UTF8)
    }
}

Write-Host "Documentation has been created at: $outputPath"

# 결과 확인을 위한 자동 실행 (선택사항)
Invoke-Item $outputPath