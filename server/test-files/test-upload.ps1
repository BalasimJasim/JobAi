# Test file path
$filePath = "test-files/test-resume.txt"

# Create form data
$form = @{
    resume = Get-Item -Path $filePath
}

Write-Host "Uploading file: $filePath"
Write-Host "To endpoint: http://localhost:5000/api/resumes/upload"
Write-Host ""

try {
    $response = Invoke-WebRequest -Method Post -Uri "http://localhost:5000/api/resumes/upload" -Form $form
    
    Write-Host "Response Status Code: $($response.StatusCode)"
    Write-Host "Response Content:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        $responseBody
    }
} 