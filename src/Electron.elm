module Electron exposing (..)

import Task exposing (Task)
import Native.Electron

showOpenDialog: Task Never (List String)
showOpenDialog =
  Native.Electron.showOpenDialog()
