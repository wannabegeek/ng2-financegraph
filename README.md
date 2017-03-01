# ng2-split-pane

[![npm version](https://badge.fury.io/js/ng2-split-pane.svg)](https://www.npmjs.com/package/ng2-split-panehttps://badge.fury.io/js/ng2-split-pane.sv://plnkr.co/bxgcK29PNl9lexw6z6Ym)

Split View module for Angular 2

See an example on [plnkr here](https://plnkr.co/bxgcK29PNl9lexw6z6Ym)

I should be pretty easy to use (hopefully), you can ether have a `horizontal-split-pane` or a `vertical-split-pane`

These can take 3 optional configuration values;

|Key                              | Range                                                     | Does                                                                                                     |
|---------------------------------|-----------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
|`primary-component-minsize`      | value in pixels                                           | Only allow the primary pane (either top or left) to go as small as this                                  |
|`secondary-component-minsize`    | value in pixels                                           | Only allow the secondary pane (either bottom or right) to go as small as this                            |
|`primary-component-initialratio` | initial value in a ratio of primary/secondary (range 0-1) | The initial size to create the primary pane (secondary will fill the remaining), this value will be over-ridden if a value is found in the local storage. |
|`local-storage-key`              | string value used as the key                              | If this value is present, uses this key withing localstorage to remember the position of the divider bar |


```javascript
<horizontal-split-pane primary-component-minsize="50" secondary-component-minsize="100" local-storage-key="split-pane" primary-component-initialratio="0.8">
    <div class="split-pane-content-primary">
        <div class="upper">
            Upper pane
        </div>
    </div>
    <div class="split-pane-content-secondary">
        <div class="lower">
            Lower pane
        </div>
    </div>
</horizontal-split-pane>

```

## Events

`(on-change)` - emitted when a change in the size of the component happens

`(on-begin-resizing)` - emitted when the user begins dragging the separator

`(on-ended-resizing)` - emitted when the user releases the separator after dragging

## Development

To build...
`npm run tsc`

