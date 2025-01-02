## Tygrak's Point Renderer

Point Rendering using TypeScript and WebGPU.

### Prerequisites

`npm`, `webpack`

### Building

To build the application, `npm` needs to be installed first. 

`npm install --save-dev webpack` to install webpack, which is required for building the application.
`npm run dev` to build the project. The resulting site is contained in the folder `public`.

### Running the Application

Open `index.html`, which is contained in the folder `public` in the browser. A browser with WebGPU support is needed. New versions of Chrome, starting with Chrome 113, support WebGPU by default. The full implementation status for other browsers can be found [here](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status).

Use the flag `--disable-dawn-features=disallow_unsafe_apis` when starting Chrome Canary to enable timestamps, which allows getting accurate frametimes.