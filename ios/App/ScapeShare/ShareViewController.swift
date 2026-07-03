import UIKit
import UniformTypeIdentifiers

/// The Share Extension's only job: grab the shared image, write it to the
/// app-group container both apps can see, then open ScapeStudio via its
/// custom URL scheme. No UI beyond a brief native activity indicator - the
/// actual review/edit happens in ScapeStudio itself once it opens with the
/// photo already loaded, so there's nothing useful to show here.
class ShareViewController: UIViewController {

    private let appGroupId = "group.uk.scsq.studio"
    private let sharedImageFileName = "pending-share.jpg"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        handleSharedItem()
    }

    private func handleSharedItem() {
        guard
            let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
            let itemProvider = extensionItem.attachments?.first
        else {
            completeAndClose()
            return
        }

        if itemProvider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, error in
                guard let self = self else { return }
                guard error == nil else {
                    self.completeAndClose()
                    return
                }

                // The system hands this back as one of three shapes
                // depending on the source app - handle all three rather
                // than assuming Photos always gives a file URL (it doesn't
                // always: some share sheet paths deliver a raw UIImage or
                // Data instead).
                var imageData: Data?
                if let url = item as? URL {
                    imageData = try? Data(contentsOf: url)
                } else if let image = item as? UIImage {
                    imageData = image.jpegData(compressionQuality: 0.92)
                } else if let data = item as? Data {
                    imageData = data
                }

                guard let data = imageData else {
                    self.completeAndClose()
                    return
                }

                self.writeToAppGroupAndOpenHost(data: data)
            }
        } else {
            completeAndClose()
        }
    }

    private func writeToAppGroupAndOpenHost(data: Data) {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
            completeAndClose()
            return
        }
        let fileURL = containerURL.appendingPathComponent(sharedImageFileName)

        // Re-encode through UIImage rather than writing the raw shared
        // bytes directly - the source could be HEIC/PNG/etc, and
        // ScapeStudio's __scapeShareReceived handler on the JS side expects
        // a plain JPEG it can hand straight to the existing editor pipeline
        // without needing its own HEIC-sniffing logic duplicated here.
        guard let uiImage = UIImage(data: data), let jpegData = uiImage.jpegData(compressionQuality: 0.92) else {
            completeAndClose()
            return
        }

        do {
            try jpegData.write(to: fileURL, options: .atomic)
        } catch {
            completeAndClose()
            return
        }

        openHostApp()
    }

    /// Share extensions can't call UIApplication.shared.open(_:) directly -
    /// it doesn't exist in the extension process. The documented workaround
    /// is walking the responder chain to find UIApplication (which DOES
    /// exist in the host app process the extension is presented over) and
    /// invoking its openURL: via a selector, since the compiler won't let
    /// an extension target reference UIApplication.shared.open at all.
    private func openHostApp() {
        guard let url = URL(string: "scapestudio://shared") else {
            completeAndClose()
            return
        }

        var responder: UIResponder? = self
        let selector = sel_registerName("openURL:")
        while let current = responder {
            if current.responds(to: selector) {
                current.perform(selector, with: url)
                break
            }
            responder = current.next
        }

        completeAndClose()
    }

    private func completeAndClose() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
