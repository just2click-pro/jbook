import * as esbuild from 'esbuild-wasm';
import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
  const ref = useRef<any>()
  const iframeRef = useRef<any>()
  const [input, setInput] = useState('')
  const [code, setCode] = useState('')

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window'
      }
    });

    // setCode(result.outputFiles[0].text);
    iframeRef.current.contentWindow.postMessage(result.outputFiles[0].text, '*')
  };

  const html = `
    <html>
      <head>

      </head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (e) {
              const root = document.querySelector('#root');
              root.innerHTML = '<div style="color: tomato;"><h4>Runtime Error</h4>' + err + '</div>';
            }
          }, false);
        </script>
      </body>
    </html>
  `
  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe ref={iframeRef} sandbox="allow-scripts" srcDoc={html}/>
    </div>
  )
}

const container = document.getElementById('root')
if (
  container) {
  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  root.render(<App />);
}