'use babel'

import {Emitter, CompositeDisposable} from 'event-kit'
import {ipcRenderer} from 'electron'

export default class AutoUpdateManager {
  constructor ({applicationDelegate}) {
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()

    this.subscriptions.add(
      applicationDelegate.onDidBeginCheckingForUpdate(() => {
        this.emitter.emit('did-begin-checking-for-update')
      }),
      applicationDelegate.onDidBeginDownloadingUpdate(() => {
        this.emitter.emit('did-begin-downloading-update')
      }),
      applicationDelegate.onDidCompleteDownloadingUpdate((details) => {
        this.emitter.emit('did-complete-downloading-update', details)
      }),
      applicationDelegate.onUpdateNotAvailable(() => {
        this.emitter.emit('update-not-available')
      })
    )
  }

  dispose () {
    this.subscriptions.dispose()
    this.emitter.dispose()
  }

  checkForUpdate () {
    ipcRenderer.send('check-for-update')
  }

  restartAndInstallUpdate () {
    ipcRenderer.send('install-update')
  }

  getState () {
    return ipcRenderer.sendSync('get-auto-update-manager-state')
  }

  platformSupportsUpdates () {
    return this.getReleaseChannel() == 'stable' && (this.getPlatform() === 'darwin' || this.getPlatform() === 'win32')
  }

  onDidBeginCheckingForUpdate (callback) {
    return this.emitter.on('did-begin-checking-for-update', callback)
  }

  onDidBeginDownloadingUpdate (callback) {
    return this.emitter.on('did-begin-downloading-update', callback)
  }

  onDidCompleteDownloadingUpdate (callback) {
    return this.emitter.on('did-complete-downloading-update', callback)
  }

  // TODO: When https://github.com/atom/electron/issues/4587 is closed, we can
  // add an update-available event.
  // onUpdateAvailable (callback) {
  //   return this.emitter.on('update-available', callback)
  // }

  onUpdateNotAvailable (callback) {
    return this.emitter.on('update-not-available', callback)
  }

  getPlatform () {
    return process.platform
  }

  // TODO: We should move this into atom env or something.
  getReleaseChannel () {
    let version = atom.getVersion()
    if (version.indexOf('beta') > -1) {
      return 'beta'
    } else if (version.indexOf('dev') > -1) {
      return 'dev'
    }
    return 'stable'
  }
}
