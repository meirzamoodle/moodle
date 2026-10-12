// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

import {Component, Suspense, use, type ReactNode} from 'react';
import {forgetString, getString, type StringParams} from './stringUtils';

export interface StringProps {
    identifier: string;
    component?: string;
    params?: StringParams;
}

function StringInner({identifier, component, params}: StringProps) {
    return <>{use(getString(identifier, component, params))}</>;
}

/** Shows the fallback instead of the string when fetching it failed, rather than unmounting the whole root. */
class StringErrorBoundary extends Component<{fallback: ReactNode; onError: () => void; children: ReactNode}, {failed: boolean}> {
    state = {failed: false};

    static getDerivedStateFromError() {
        return {failed: true};
    }

    componentDidCatch() {
        this.props.onError();
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

function String({children, identifier, component = 'core', params}: StringProps & {children?: ReactNode}) {
    const fallback = children ?? `${identifier}, ${component}`;

    return (
        <StringErrorBoundary fallback={fallback} onError={() => forgetString(identifier, component, params)}>
            <Suspense fallback={fallback}>
                <StringInner identifier={identifier} component={component} params={params} />
            </Suspense>
        </StringErrorBoundary>
    );
}

export default String;
