import { createApp } from 'js-act';

import { ThemeToggle }      from './components/ThemeToggle';
import { HeroDemo }         from './components/HeroDemo';
import { SignalCounter }    from './components/SignalCounter';
import { ComputedDemo }     from './components/ComputedDemo';
import { TextBind }         from './components/TextBind';
import { GlobalSignalDemo } from './components/GlobalSignalDemo';
import { TodoDemo }         from './components/TodoDemo';
import { LifecycleDemo }    from './components/LifecycleDemo';
import { RefDemo }          from './components/RefDemo';
import { ElDemo }           from './components/ElDemo';
import { RouterDemo }       from './components/RouterDemo';
import { ResourceDemo }     from './components/ResourceDemo';
import { DepsDemo }         from './components/DepsDemo';

createApp('#theme-toggle-mount').mount(ThemeToggle);
createApp('#hero-demo').mount(HeroDemo);
createApp('#signal-counter-preview').mount(SignalCounter);
createApp('#computed-preview').mount(ComputedDemo);
createApp('#textbind-preview').mount(TextBind);
createApp('#global-signal-preview').mount(GlobalSignalDemo);
createApp('#todo-preview').mount(TodoDemo);
createApp('#lifecycle-preview').mount(LifecycleDemo);
createApp('#ref-preview').mount(RefDemo);
createApp('#el-preview').mount(ElDemo);
createApp('#router-preview').mount(RouterDemo);
createApp('#resource-preview').mount(ResourceDemo);
createApp('#deps-preview').mount(DepsDemo);
