port module App exposing (..)

import Task exposing (Task)
import Html exposing (Html, body, div, span, text, h1, h3, input, button, label, ol, ul, li, form, table, tr, th, td)
import Html.Attributes exposing (type_, value, placeholder, title, checked, step, style)
import Html.Events exposing (onClick, onInput, onCheck, onSubmit)

import Configuration exposing (Configuration)
import File exposing (File)
import Logger exposing (Logger)
import Level exposing (Level)
import Log exposing (Log, FullLog)
import Payload exposing (Payload)
import Filters exposing (Filters)
import Watcher
import Electron
import Styles exposing (id, class, classList)
import Header
import Settings
import Alert

type alias Flags =
  { files: Maybe (List File)
  , filters: Maybe Filters
  , configuration: Maybe Configuration
  , loggers: Maybe (List Logger)
  , levels: Maybe (List Level)
  }

type alias Model =
  { logs: List FullLog
  , files: List File
  , filters: Filters
  , configuration: Configuration
  , loggers: List Logger
  , levels: List Level
  , normalize: Normalizer
  , notifications: List Notification
  , settingsOpened: Bool
  , header: Header.Model
  , settings: Settings.Model
  }

type Duration = Ever | LastMonth | LastWeek | LastDay | LastHour | LastFiveMinute

type Severity = Error | Warning | Info

type alias Notification =
  { severity: Severity
  , message: String
  }

type alias Normalizer = FullLog -> FullLog

type Msg
  = Watch Watcher.Event
  | Logs File (List Log)
  | NotificationAdded Notification
  | NotificationRemoved Notification
  | NotificationCleared
  | AddFiles (List String)
  | RemoveFile String
  | ClearFile File
  | Normalizer
  | Normalize
  | OpenLoadFile
  | OpenSettings
  | SaveSettings
  | CloseSettings
  | Toggle FullLog
  | TogglePayload FullLog Payload
  | HeaderMsg Header.Msg
  | SettingsMsg Settings.Msg

main: Program Flags Model Msg
main =
  Html.programWithFlags
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

init: Flags -> (Model, Cmd Msg)
init flags =
  let
    files = Maybe.withDefault [] flags.files
    filters = Maybe.withDefault Header.init flags.filters
    configuration = Maybe.withDefault Configuration.default flags.configuration
    loggers = Maybe.withDefault [] flags.loggers
    levels = Maybe.withDefault [] flags.levels
    model =
      { logs = []
      , files = files
      , filters = filters
      , configuration = configuration
      , loggers = loggers
      , levels = levels
      , normalize = identity
      , notifications = []
      , settingsOpened = False
      , header = filters
      , settings = Settings.init
      }
  in
    { model | normalize = normalizerOf model } ! [ Watcher.watch (List.map .path files) ]

update: Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    NotificationAdded notif ->
      { model | notifications = List.append model.notifications [ Debug.log "ADD NOTIF" notif ] } ! []

    NotificationRemoved notif ->
      { model | notifications = List.filter (\n -> n /= notif) model.notifications } ! []

    NotificationCleared ->
      { model | notifications = [] } ! []

    Watch event -> case event of
      Watcher.Added path stats ->
        let
          knownFile = File.find model.files path
          file = case knownFile of
            Just f -> f
            Nothing -> File.new path stats
          files = case knownFile of
            Just f -> model.files
            Nothing -> file :: model.files
          md = { model | files = files }
        in
          md ! [ doSave md, Task.attempt (onRead file model) <| Watcher.read { path = file.path, from = file.readUntil, to = stats.size } ]

      Watcher.Changed path stats ->
        case File.find model.files path of
          Nothing -> model ! [ notif Warning <| "Watching " ++ path ++ " but not in model" ]
          Just file -> { model | files = File.update path stats.size stats.mtime model.files }
            ! [ Task.attempt (onRead file model) <| Watcher.read { path = file.path, from = file.readUntil, to = stats.size } ]

      Watcher.Unlinked path ->
        case File.find model.files path of
          Nothing -> model ! []
          Just file -> model ! [ notif Info <| "File " ++ path ++ " has been deleted but we are still watching it" ]

    Logs file logs ->
      let
        fullLogs =
          logs
          |> List.map (model.normalize << Log.toFull file)
          |> List.sortWith Log.compare
      in
        { model | logs = List.append fullLogs model.logs } ! []

    AddFiles paths ->
      model ! [ if List.isEmpty paths then Cmd.none else Watcher.watch paths ]

    RemoveFile path ->
      let
        md = { model | files = File.without path model.files }
      in md ! [ doSave md, Watcher.unwatch [ path ], normalize ]

    Normalizer ->
      { model | normalize = normalizerOf model } ! [ normalize ]

    Normalize ->
      { model | logs = List.map model.normalize model.logs } ! [ notif Info "Normalized" ]

    OpenSettings ->
      let
        defaultSettings = Settings.init
        settings =
          { defaultSettings
          | configuration = model.configuration
          , files = model.files
          , loggers = model.loggers
          , levels = model.levels
          }
      in
        { model | settingsOpened = True, settings = settings } ! []

    SaveSettings ->
      let
        md =
          { model
          | configuration = model.settings.configuration
          , files = model.settings.files
          , loggers = model.settings.loggers
          , levels = model.settings.levels
          }
      in md ! [ doSave md, cmd CloseSettings, normalize ]

    CloseSettings ->
      { model | settingsOpened = False } ! []

    OpenLoadFile -> model ! [ Task.perform AddFiles Electron.showOpenDialog ]

    ClearFile file -> model ! []

    Toggle log ->
      let
        logs =
          List.map
            (\l ->
              if l == log
              then { l | opened = not l.opened, payload = if l.opened then Maybe.map Payload.close l.payload else l.payload }
              else l

            )
            model.logs
      in
        { model | logs = logs } ! []

    TogglePayload log payload ->
      let
        logs =
          List.map
            (\l -> if l == log then { l | payload = Maybe.map (\p -> Payload.toggleChild payload p) l.payload } else l)
            model.logs
      in
        { model | logs = logs } ! []

    SettingsMsg settingsMsg ->
      let
        (md, fx) = Settings.update settingsMsg model.settings
      in
        { model | settings = md } ! [ Cmd.map SettingsMsg fx ]

    HeaderMsg headerMsg ->
      case headerMsg of
        Header.Action actionMsg -> case actionMsg of
          Header.Normalize -> model ! [ normalizer ]
          Header.OpenSettings -> update OpenSettings model
          Header.OpenLoadFile -> update OpenLoadFile model
          Header.UpdateFiles files -> { model | files = files } ! [ normalizer ]
          Header.UpdateLoggers loggers -> { model | loggers = loggers } ! [ normalizer ]
          Header.UpdateLevels levels -> { model | levels = levels } ! [ normalizer ]
          Header.ClearFile file -> update (ClearFile file) model

        _ ->
          let
            (md, fx) = Header.update headerMsg model.header
          in
            { model | header = md } ! [ Cmd.map HeaderMsg fx ]


subscriptions: Model -> Sub Msg
subscriptions model =
  Watcher.listen Watch

onRead: File -> Model -> Result String String -> Msg
onRead file model res = case res of
  Err err -> NotificationAdded { severity = Error, message = err }
  Ok data -> Logs file (Log.parse model.configuration data)

cmd: Msg -> Cmd Msg
cmd message =
  Task.perform (always message) <| Task.succeed ()

notif: Severity -> String -> Cmd Msg
notif sev msg =
  cmd <| NotificationAdded { severity = sev, message = msg }

normalizerOf: Model -> Normalizer
normalizerOf { files, loggers, filters, levels } =
  let
    findLogger = Logger.find loggers
    findLevel = Level.find levels
    findFile = File.find files
    isEnabled = Log.isEnabled filters
  in
    (\log ->
      let updatedLog =
        { log
        | logger = Maybe.withDefault Nothing <| Maybe.map findLogger log.loggerName
        , file = Maybe.withDefault log.file <| findFile log.file.path
        , level = findLevel log.levelName
        }
      in { updatedLog | enabled = isEnabled updatedLog }
    )

normalizer: Cmd Msg
normalizer =
  cmd Normalizer

normalize: Cmd Msg
normalize =
  cmd Normalize

doSave: Model -> Cmd Msg
doSave model =
  save
    { configuration = model.configuration
    , files = model.files
    , loggers = model.loggers
    , levels = model.levels
    }

port save: { configuration: Configuration, files: List File, loggers: List Logger, levels: List Level } -> Cmd msg


-- view
view: Model -> Html Msg
view model =
  div
    [ classList [ (Styles.NoScroll, model.settingsOpened) ] ]
    [ viewNotifications model
    , viewHeader model
    , viewSettings model
    , viewLogs model
    ]

viewHeader: Model -> Html Msg
viewHeader model =
  Html.map HeaderMsg <| Header.view { files = model.files, loggers = model.loggers, levels = model.levels } model.header

viewSettings: Model -> Html Msg
viewSettings model =
  div
    [ id Styles.Settings, classList [ (Styles.Opened, model.settingsOpened) ] ]
    [ div [ class [ Styles.Mask ], onClick CloseSettings ] []
    , div
      [ class [ Styles.Content ] ]
      [ Html.map SettingsMsg <| Settings.view model.settings
      , button [ type_ "button", onClick SaveSettings ] [ text "Save" ]
      ]
    ]

viewNotifications: Model -> Html Msg
viewNotifications model =
  ol
    [ id Styles.Notifications ]
    (List.map viewNotification model.notifications)

viewNotification: Notification -> Html Msg
viewNotification notif =
  li
    [ class [ Styles.Notification ]
    , classList
      [ (Styles.NotificationInfo, notif.severity == Info)
      , (Styles.NotificationWarning, notif.severity == Warning)
      , (Styles.NotificationError, notif.severity == Error)
      ]
    ]
    [ text notif.message ]

viewLogs: Model -> Html Msg
viewLogs model =
  table
    [ id Styles.Logs ]
    (List.map viewLog model.logs)

viewLog: FullLog -> Html Msg
viewLog log =
  tr
    [ class [ Styles.Log ] ]
    [ td [ class [ Styles.Level ], style [("background-color", Maybe.withDefault "#eee" <| Maybe.map .color log.level)], title log.clock ] [ text log.clock ]
    , td
      [ class [ Styles.Message ] ]
      (
        case log.payload of
          Nothing ->
            [ div [ class [ Styles.Content ] ] [ text log.message ] ]
          Just payload ->
            [ div [ class [ Styles.Content, Styles.ClickMe ], onClick <| Toggle log ] [ text log.message ]
            , div [ class [ Styles.Payload ], style [ ("display", if log.opened then "block" else "none") ] ] [ viewPayload log payload ]
            ]
      )
    , td [ class [ Styles.File ] ] [ text "file" ]
    ]

viewPayload: FullLog -> Payload -> Html Msg
viewPayload log payload =
  ul
    []
    (
      case payload of
        Payload.JsNull -> [ Payload.viewNull "payload" ]
        Payload.JsString str -> [ Payload.viewString "payload" str ]
        Payload.JsNumber num -> [ Payload.viewNumber "payload" num ]
        Payload.JsBoolean bool -> [ Payload.viewBoolean "payload" bool ]
        Payload.JsArray opened items -> Payload.viewArrayItems (TogglePayload log) items
        Payload.JsObject opened values -> Payload.viewObjectValues (TogglePayload log) values
    )
