import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useHearts } from '../contexts/HeartsContext.jsx';

const Hearts = () => {
    const { hearts, timeUntilRegeneration } = useHearts();
    
    console.log('Hearts component render:', { hearts, timeUntilRegeneration });
    
    const formatTime = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (_jsxs("div", { className: "space-y-2", children: [
        _jsx("div", { 
            className: "flex items-center space-x-1", 
            children: Array.from({ length: 5 }).map((_, index) => (
                _jsxs("svg", { 
                    className: `w-6 h-6 ${index < hearts ? 'text-red-500' : 'text-gray-300'}`, 
                    fill: "currentColor", 
                    viewBox: "0 0 20 20", 
                    xmlns: "http://www.w3.org/2000/svg", 
                    children: [
                        _jsx("path", { 
                            fillRule: "evenodd", 
                            d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", 
                            clipRule: "evenodd" 
                        }), 
                        index >= hearts && (
                            _jsx("path", { 
                                fillRule: "evenodd", 
                                d: "M10 17.657l-6.828-6.829a4 4 0 010-5.656l1.172 1.171L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657z", 
                                clipRule: "evenodd", 
                                className: "text-red-500", 
                                style: { clipPath: 'polygon(0% 100%, 100% 100%, 100% 75%, 0% 75%)' } 
                            })
                        )
                    ] 
                }, index)
            )) 
        }), 
        hearts === 0 && timeUntilRegeneration && (
            _jsxs("div", { 
                className: "text-sm text-gray-400", 
                children: [
                    _jsx("p", { children: "Hearts will regenerate in:" }), 
                    _jsx("p", { 
                        className: "font-mono text-yellow-500", 
                        children: formatTime(timeUntilRegeneration) 
                    })
                ] 
            })
        )
    ] }));
};

export default Hearts;
