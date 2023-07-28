# Charting

This code was taken from https://github.com/scottyantipa/react-data-viz and converted form Coffeescript to Javascript. It is not the most beautiful code and will probably be replaced completely by a proper charting library. The API to the primary component -- TimeChart -- is fairly straight forward and is what will need to be replaced once we pick a new library. The supporting components like Scale, Axis, TimeAxis, etc. should not have to be rewritten or updated since a new library will come with these features built in.

# TODO
- Passing `canvasScale` to everything that needs to use ctx is a bit ugly. Could have higher level drawing methods that only know about this scale.
