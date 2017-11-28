port module Styles exposing (..)

import Css exposing (..)
import Css.Elements exposing (..)
import Css.Namespace exposing (namespace)
import Css.File exposing (CssFileStructure, CssCompilerProgram)
import Html.CssHelpers

port files : CssFileStructure -> Cmd msg

fileStructure : CssFileStructure
fileStructure =
    Css.File.toFileStructure
        [ ( "styles.css", Css.File.compile [ css ] ) ]

main : CssCompilerProgram
main =
    Css.File.compiler files fileStructure

{ id, class, classList } =
    Html.CssHelpers.withNamespace ""

type Ids
  = Header
  | Settings
  | Logs
  | Notifications

type Classes
  = NoScroll
  | ClickMe
  | Disabled
  | Actions
  | Action
  | Filters
  | Filter
  | Dropdown
  | DropdownContent
  | IsRight
  | Message
  | Clear
  | Load
  | Loggers
  | Logger
  | Files
  | File
  | Durations
  | Duration
  | Levels
  | Level
  | User
  | Mask
  | Content
  | Opened
  | Log
  | Payload
  | PayloadKey
  | PayloadString
  | PayloadUndefined
  | PayloadNull
  | PayloadBoolean
  | PayloadNumber
  | PayloadDate
  | PayloadObject
  | PayloadArray
  | Notification
  | NotificationInfo
  | NotificationWarning
  | NotificationError

css: Stylesheet
css =
  stylesheet
    [ everything
      [ boxSizing borderBox ]
    , selector "html body"
      [ margin zero
      , padding zero
      ]
    , (.) NoScroll [ overflow hidden ]
    , (.) ClickMe [ cursor pointer ]
    , header
    , settings
    , selector "#Settings.Opened" [ display block ]
    , logs
    , payload
    , notifications
    , (.) Opened [ display block ]
    ]

header: Snippet
header =
  (#) Header
    [ position fixed
    , top zero
    , left zero
    , right zero
    , backgroundColor <| hex "#2c3e50"
    , color <| hex "#ffffff"
    , property "z-index" "10"
    , descendants
      [ h1
        [ fontSize <| px 12
        , marginLeft <| px 5
        ]
      , (.) Actions
        [ position absolute
        , top <| px 0
        , right <| px 0
        , displayFlex
        , flexDirection row
        , descendants
          [ (.) Action
            [ display block
            , width <| px 20
            , backgroundColor <| hex "#ffffff"
            , color <| hex "#2c3e50"
            , border zero
            , marginRight <| px 10
            , cursor pointer
            ]
          ]
        ]
      , (.) Message
        [ padding2 (px 5) (px 10)
        , descendants
          [ input
            [ width <| pct 50
            , padding2 (px 5) (px 10)
            , borderRadius <| px 5
            ]
          ]
        ]
      , (.) Filters
        [ displayFlex
        , property "justify-content" "flex-start"
        , padding <| px 10
        , descendants
          [ (.) Filter
            [ border3 (px 3) solid (hex "#ffffff")
            , borderRadius  <| px 5
            , padding2 (px 5) (px 10)
            , marginRight <| px 10
            ]
          ]
        ]
      , (.) Dropdown
        [ position relative
        , hover
          [ descendants [ (.) DropdownContent [ display block ] ]
          ]
        ]
      , (.) DropdownContent
        [ display none
        , position absolute
        , top <| pct 100
        , left zero
        , backgroundColor <| hex "#2c3e50"
        , minWidth <| px 100
        , descendants
          [ label
            [ display block
            , whiteSpace noWrap
            , padding <| px 5
            , cursor pointer
            ]
          ]
        ]
      , (.) IsRight
        [ left auto
        , right zero
        ]
      , (.) Level
        [ display inlineBlock
        , width <| px 30
        , height <| px 30
        , textAlign center
        , fontWeight bold
        , paddingTop <| px 5
        , withClass Disabled [ opacity <| num 0.2 ]
        ]
      ]
    ]

settings: Snippet
settings =
  (#) Settings
    [ display none
    , descendants
      [ (.) Mask
        [ position fixed
        , property "z-index" "20"
        , top zero
        , bottom zero
        , left zero
        , right zero
        , backgroundColor <| rgba 0 0 0 0.5
        ]
      , (.) Content
        [ position fixed
        , property "z-index" "21"
        , top <| pct 10
        , bottom <| pct 10
        , left <| pct 10
        , right <| pct 10
        , backgroundColor <| hex "#ffffff"
        , padding <| px 20
        , overflowX hidden
        , overflowY auto
        ]
      ]
    ]

logs: Snippet
logs =
  (#) Logs
    [ margin zero
    , padding zero
    , marginTop <| px 170
    , width <| pct 100
    , descendants [ log ]
    ]

log: Snippet
log =
  (.) Log
  [ descendants
    [ logLevel
    , logMessage
    , logFile
    ]
  ]

logLevel: Snippet
logLevel =
  (.) Level
  [ backgroundColor <| hex "#444"
  , color <| hex "#ffffff"
  , width <| px 180
  , padding <| px 5
  , verticalAlign top
  ]

logMessage: Snippet
logMessage =
  (.) Message
  [ padding2 (px 5) (px 10)
  ]

logFile: Snippet
logFile =
  (.) File
  [ width <| px 15
  , padding <| px 5
  , verticalAlign top
  , children
    [ div
      [ width <| px 15
      , height  <| px 15
      , borderRadius <| pct 50
      , border3 (px 3) solid (hex "#fff")
      ]
    ]
  ]

payloadKey = hex "#0000ff"
payloadString = hex "#0000ff"
payloadHighLight = hex "#ff0000"

payload: Snippet
payload =
  (.) Payload
  [ children
    [ ul [ paddingLeft zero, margin2 (px 5) (px 0) ] ]
  , descendants
    [ ul [ listStyle none, paddingLeft <| px 20 ]
    , (.) PayloadKey [ color payloadKey ]
    , (.) PayloadString [ color payloadString ]
    , (.) PayloadUndefined [ color payloadHighLight ]
    , (.) PayloadNull [ color payloadHighLight ]
    , (.) PayloadBoolean [ color payloadHighLight ]
    , (.) PayloadNumber [ color payloadHighLight ]
    , (.) PayloadDate [ color payloadHighLight ]
    , (.) PayloadObject [ position relative ]
    , (.) PayloadArray [ position relative ]
    , selector ".PayloadKey.ClickMe::before" [ payloadArrowCommon, payloadArrowClosed ]
    , selector ".PayloadKey.ClickMe.Opened::before" [ payloadArrowCommon, payloadArrowOpened ]
    ]
  ]

payloadArrowCommon: Mixin
payloadArrowCommon =
  mixin
  [ property "content" "''"
  , boxSizing borderBox
  , position absolute
  , top <| px 4
  , left zero
  , borderColor transparent
  , borderStyle solid
  ]

payloadArrowOpened: Mixin
payloadArrowOpened =
  mixin
  [ borderTopColor <| hex "#0000ff"
  , width <| px 10
  , height <| px 20
  , borderLeftWidth <| px 5
  , borderRightWidth <| px 5
  , borderTopWidth <| px 10
  , borderBottomWidth <| px 10
  ]

payloadArrowClosed: Mixin
payloadArrowClosed =
  mixin
  [ borderLeftColor <| hex "#0000ff"
  , width <| px 20
  , borderLeftWidth <| px 10
  , borderRightWidth <| px 10
  , borderTopWidth <| px 5
  , borderBottomWidth <| px 5
  ]

notifications: Snippet
notifications =
  (#) Notifications
  [ position fixed
  , top <| px 0
  , right <| px 0
  , property "z-index" "100"
  , descendants
    [ (.) Notification
      [ padding <| px 10
      , color <| hex "#ffffff"
      , withClass NotificationInfo [ backgroundColor <| hex "#0000ff" ]
      , withClass NotificationWarning [ backgroundColor <| hex "#444400" ]
      , withClass NotificationError [ backgroundColor <| hex "#ff0000" ]
      ]
    ]
  ]
