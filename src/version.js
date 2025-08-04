// version.js
export async function displayAppVersion() {
  try {
    const response = await fetch('./CHANGELOG.md');
    if (!response.ok) throw new Error('Unable to fetch version info.');

    const changelog = await response.text();

    // Match the first occurrence of "vX.Y.Z" (latest version at top of file)
    const match = changelog.match(/v\d+\.\d+\.\d+/);
    const version = match ? match[0] : 'v1.0.0';

    // Display in sidebar
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = `Version ${version}`;
    }
  } catch (error) {
    console.error('Error loading version:', error);
  }
}
