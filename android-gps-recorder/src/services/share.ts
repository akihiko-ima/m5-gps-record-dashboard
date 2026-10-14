import * as Sharing from 'expo-sharing';

import { trackFile } from './track-files';

/** Android の共有メニューで CSV を渡す */
export async function shareTrackFile(fileName: string): Promise<void> {
  await Sharing.shareAsync(trackFile(fileName).uri, { mimeType: 'text/csv', dialogTitle: fileName });
}
