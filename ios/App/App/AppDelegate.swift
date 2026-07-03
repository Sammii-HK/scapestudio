import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // Matches the Share Extension's app-group container and file name -
    // see ScapeShare/ShareViewController.swift. A shared photo is written
    // here by the extension, then read (and deleted) here on next launch.
    // App Group container, not a network round-trip: the extension and
    // this app are the same iOS app from the system's point of view, so
    // handing off a photo between them never needs to leave the device.
    private let appGroupId = "group.uk.scsq.studio"
    private let sharedImageFileName = "pending-share.jpg"

    /// Reads and clears any photo the Share Extension left waiting, base64
    /// encodes it, and hands it to the web app via a global JS callback it
    /// defines on load. Called both on cold launch (didFinishLaunching) and
    /// on custom-URL-scheme open (an already-running app being re-shared to).
    private func deliverPendingShareToWebView() {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
            return
        }
        let fileURL = containerURL.appendingPathComponent(sharedImageFileName)
        guard let data = try? Data(contentsOf: fileURL) else { return }
        try? FileManager.default.removeItem(at: fileURL) // one-shot handoff, never re-delivered

        let base64 = data.base64EncodedString()
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController else { return }

        // The web app isn't guaranteed to have finished loading (and
        // defined window.__scapeShareReceived) the instant this runs on a
        // cold launch, so this polls briefly rather than firing once and
        // silently losing the photo on a slow load.
        func attemptDelivery(retriesLeft: Int) {
            let js = "typeof window.__scapeShareReceived === 'function'"
            bridgeVC.webView?.evaluateJavaScript(js) { result, _ in
                if (result as? Bool) == true {
                    bridgeVC.webView?.evaluateJavaScript("window.__scapeShareReceived('\(base64)')", completionHandler: nil)
                } else if retriesLeft > 0 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        attemptDelivery(retriesLeft: retriesLeft - 1)
                    }
                }
            }
        }
        attemptDelivery(retriesLeft: 15) // ~4.5s ceiling for a cold launch + page load
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Cold launch via the Share Extension (or a plain tap on the app
        // icon with a share already pending) - check for a waiting photo
        // once the window/root view controller exist.
        DispatchQueue.main.async { [weak self] in
            self?.deliverPendingShareToWebView()
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // The Share Extension opens the app via the "scapestudio://" scheme
        // once it's finished writing the photo to the app-group container -
        // this is the app-already-running/backgrounded case (cold launch is
        // handled in didFinishLaunching above instead, since a custom-scheme
        // open doesn't fire on a fresh process start the extension itself
        // triggered).
        if url.scheme == "scapestudio" {
            deliverPendingShareToWebView()
        }
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
