using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Forms;

namespace KeterLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string targetDir = Path.Combine(appData, "KeterPortable");
                string versionFile = Path.Combine(targetDir, "v1.0.1.tag");
                string exePath = Path.Combine(targetDir, "Keter.exe");
                if (!File.Exists(exePath))
                {
                    exePath = Path.Combine(targetDir, "AudioCoreHost.exe");
                }

                // First run extraction or version upgrade
                if (!File.Exists(versionFile) || !File.Exists(exePath))
                {
                    if (Directory.Exists(targetDir))
                    {
                        try { Directory.Delete(targetDir, true); } catch {}
                    }
                    Directory.CreateDirectory(targetDir);

                    Assembly assembly = Assembly.GetExecutingAssembly();
                    using (Stream stream = assembly.GetManifestResourceStream("payload.zip"))
                    {
                        if (stream == null)
                        {
                            MessageBox.Show("Package payload error.", "Keter", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            return;
                        }
                        string tempZip = Path.Combine(targetDir, "bundle.zip");
                        using (FileStream fileStream = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                        {
                            stream.CopyTo(fileStream);
                        }
                        ZipFile.ExtractToDirectory(tempZip, targetDir);
                        try { File.Delete(tempZip); } catch {}
                    }

                    File.WriteAllText(versionFile, "v1.0.1");
                }

                // Locate executable
                exePath = Path.Combine(targetDir, "Keter.exe");
                if (!File.Exists(exePath))
                {
                    exePath = Path.Combine(targetDir, "AudioCoreHost.exe");
                }

                if (!File.Exists(exePath))
                {
                    MessageBox.Show("Executable not found in package.", "Keter", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = exePath;
                startInfo.WorkingDirectory = targetDir;
                startInfo.Arguments = string.Join(" ", args);
                startInfo.UseShellExecute = true;

                Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch Keter: " + ex.Message, "Keter", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
