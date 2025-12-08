import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { IconPlayerPlay, IconCheck, IconX } from '@tabler/icons';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { flattenItems } from 'utils/collections';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import toast from 'react-hot-toast';

const ExecuteRequestsButton = forwardRef(({ instructions, collection, onExecutionComplete }, ref) => {
    const dispatch = useDispatch();
    const store = useStore();
    const collections = useSelector((state) => state.collections.collections);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionMode, setExecutionMode] = useState(null); // 'all' or 'one-by-one'
    const [results, setResults] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const findRequestInCollection = (requestName) => {
        if (!collection || !collection.items) {
            return null;
        }

        const allItems = flattenItems(collection.items);
        return allItems.find(item => {
            const name = item.name || '';
            return name.toLowerCase().includes(requestName.toLowerCase()) ||
                   requestName.toLowerCase().includes(name.toLowerCase());
        });
    };

    const applyModifications = (item, modifications) => {
        // Crear una copia profunda para no modificar la request original
        const itemCopy = cloneDeep(item);
        
        // Asegurarse de trabajar con la request correcta (draft o saved)
        if (!itemCopy.draft) {
            itemCopy.draft = { request: cloneDeep(itemCopy.request || {}) };
        }
        if (!itemCopy.draft.request) {
            itemCopy.draft.request = cloneDeep(itemCopy.request || {});
        }
        
        const request = itemCopy.draft.request;

        if (!request) {
            return itemCopy;
        }

        // Aplicar modificaciones temporales (solo en la copia)
        if (modifications.url) {
            // Validar que la URL modificada sea una URL válida
            try {
                const modifiedUrl = new URL(modifications.url);
                // Si es una URL válida y completa, usarla
                request.url = modifications.url;
            } catch (error) {
                // Si no es una URL válida, intentar construirla desde la URL original
                try {
                    const originalUrl = new URL(request.url);
                    // Si la modificación parece ser solo un path, intentar combinarlo
                    if (modifications.url.startsWith('/')) {
                        request.url = originalUrl.origin + modifications.url;
                    } else {
                        // Si no, usar la modificación tal cual (puede ser relativa)
                        request.url = modifications.url;
                    }
                } catch (e) {
                    // Si todo falla, usar la modificación tal cual
                    request.url = modifications.url;
                }
            }
        }

        if (modifications.method) {
            request.method = modifications.method;
        }

        if (modifications.body) {
            if (!request.body) {
                request.body = { mode: 'json', json: '' };
            }
            if (request.body.mode === 'json' || !request.body.mode) {
                try {
                    const currentBody = request.body.json ? JSON.parse(request.body.json) : {};
                    const mergedBody = { ...currentBody, ...modifications.body };
                    request.body.mode = 'json';
                    request.body.json = JSON.stringify(mergedBody, null, 2);
                } catch (e) {
                    // If parsing fails, create new body
                    request.body.mode = 'json';
                    request.body.json = JSON.stringify(modifications.body, null, 2);
                }
            } else if (request.body.mode === 'text') {
                // Si es texto, convertir el body a JSON string
                request.body.mode = 'json';
                request.body.json = JSON.stringify(modifications.body, null, 2);
            }
        }

        if (modifications.headers) {
            if (!request.headers) {
                request.headers = [];
            }
            Object.entries(modifications.headers).forEach(([name, value]) => {
                const existingHeader = request.headers.find(h => h.name === name);
                if (existingHeader) {
                    existingHeader.value = value;
                    existingHeader.enabled = true;
                } else {
                    request.headers.push({ name, value, enabled: true });
                }
            });
        }

        // Marcar que es una modificación temporal
        request.__temporaryModification = true;

        return itemCopy;
    };

    const executeRequest = async (instruction, index) => {
        const item = findRequestInCollection(instruction.requestName);
        
        if (!item) {
            return {
                success: false,
                error: `Request "${instruction.requestName}" no encontrada`,
                instruction,
                index
            };
        }

        const modifiedItem = applyModifications(item, instruction.modifications || {});
        const itemUid = modifiedItem.uid;

        try {
            // Execute the request
            await dispatch(sendRequest(modifiedItem, collection.uid));
            
            // Wait for response to be processed - poll until response is received
            let response = null;
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds max wait
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Get updated collection and item from Redux state using getState() for latest state
                const state = store.getState();
                const currentCollections = state.collections.collections || [];
                const currentCollection = currentCollections.find(c => c.uid === collection.uid);
                
                if (currentCollection) {
                    const allItems = flattenItems(currentCollection.items || []);
                    const updatedItem = allItems.find(i => i.uid === itemUid);
                    
                    // Check if response is ready and matches this request
                    if (updatedItem?.response && updatedItem?.requestState === 'received') {
                        // Verify this is a fresh response (not from a previous execution)
                        // by checking if the response has a recent timestamp or is not null
                        response = updatedItem.response;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // If still no response after waiting, try one more time to get latest
            if (!response) {
                const state = store.getState();
                const currentCollections = state.collections.collections || [];
                const currentCollection = currentCollections.find(c => c.uid === collection.uid);
                
                if (currentCollection) {
                    const allItems = flattenItems(currentCollection.items || []);
                    const updatedItem = allItems.find(i => i.uid === itemUid);
                    response = updatedItem?.response || null;
                }
            }
            
            const isSuccess = response && !response.isError && response.status !== 'Error';
            
            return {
                success: isSuccess,
                requestName: instruction.requestName,
                response: response,
                status: response?.status,
                statusText: response?.statusText,
                error: response?.error || (isSuccess ? null : 'Request failed'),
                instruction,
                index
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error ejecutando request',
                instruction,
                index
            };
        }
    };

    const handleExecuteAll = async () => {
        setIsExecuting(true);
        setExecutionMode('all');
        setResults([]);
        setCurrentIndex(0);

        const executionResults = [];

        for (let i = 0; i < instructions.length; i++) {
            setCurrentIndex(i);
            const result = await executeRequest(instructions[i], i);
            executionResults.push(result);
            setResults([...executionResults]);

            // Small delay between requests
            if (i < instructions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        setIsExecuting(false);
        if (onExecutionComplete) {
            onExecutionComplete(executionResults);
        }
    };

    // Expose executeAll function via ref
    useImperativeHandle(ref, () => ({
        executeAll: () => {
            handleExecuteAll();
        }
    }), [instructions, collection]);

    const handleExecuteOneByOne = () => {
        setExecutionMode('one-by-one');
        setResults([]);
        setCurrentIndex(0);
        setIsExecuting(false); // No ejecutar automáticamente, esperar click
    };

    const handleExecuteNext = async () => {
        if (currentIndex >= instructions.length) {
            setIsExecuting(false);
            setExecutionMode(null);
            if (onExecutionComplete) {
                onExecutionComplete(results);
            }
            return;
        }

        setIsExecuting(true);
        const result = await executeRequest(instructions[currentIndex], currentIndex);
        const newResults = [...results, result];
        setResults(newResults);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsExecuting(false);

        if (nextIndex >= instructions.length) {
            // Todas las requests ejecutadas
            setExecutionMode('completed');
            if (onExecutionComplete) {
                onExecutionComplete(newResults);
            }
        }
    };

    if (executionMode === null) {
        return (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm mb-2">
                    Se encontraron {instructions.length} request{instructions.length > 1 ? 's' : ''} para ejecutar.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={handleExecuteAll}
                        disabled={isExecuting}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconPlayerPlay size={16} />
                        Ejecutar Todos
                    </button>
                    <button
                        onClick={handleExecuteOneByOne}
                        disabled={isExecuting}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconPlayerPlay size={16} />
                        Ejecutar Uno por Uno
                    </button>
                </div>
            </div>
        );
    }

    if (executionMode === 'one-by-one') {
        // Si ya se completaron todas, mostrar resultados
        if (currentIndex >= instructions.length && results.length > 0) {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            return (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                        {failCount === 0 ? (
                            <IconCheck size={18} className="text-green-600" />
                        ) : (
                            <IconX size={18} className="text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                            Ejecución completada: {successCount} exitosa{successCount !== 1 ? 's' : ''}, {failCount} fallida{failCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {results.map((result, idx) => (
                            <div key={idx} className="text-xs">
                                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                                    {result.success ? '✓' : '✗'} {result.requestName || result.instruction?.requestName}
                                </span>
                                {result.error && (
                                    <span className="text-red-600 ml-2">: {result.error}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Si aún hay requests por ejecutar
        if (currentIndex < instructions.length) {
            const currentInstruction = instructions[currentIndex];
            const hasModifications = currentInstruction.modifications && 
                Object.keys(currentInstruction.modifications).length > 0;
            
            return (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm mb-2 font-medium">
                        Request {currentIndex + 1} de {instructions.length}: {currentInstruction.requestName}
                    </p>
                    {hasModifications && (
                        <div className="text-xs mb-2 text-gray-600 dark:text-gray-400">
                            Modificaciones temporales aplicadas (no se guardarán en la request original)
                        </div>
                    )}
                    <button
                        onClick={handleExecuteNext}
                        disabled={isExecuting}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconPlayerPlay size={16} />
                        {isExecuting ? 'Ejecutando...' : (currentIndex === 0 && results.length === 0 ? 'Ejecutar Primero' : 'Ejecutar Siguiente')}
                    </button>
                    {results.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            {results.length} de {instructions.length} ejecutada{results.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            );
        }
    }

    if (executionMode === 'all' && results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="flex items-center gap-2 mb-2">
                    {failCount === 0 ? (
                        <IconCheck size={18} className="text-green-600" />
                    ) : (
                        <IconX size={18} className="text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                        Ejecución completada: {successCount} exitosa{successCount !== 1 ? 's' : ''}, {failCount} fallida{failCount !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="space-y-1">
                    {results.map((result, idx) => (
                        <div key={idx} className="text-xs">
                            <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                                {result.success ? '✓' : '✗'} {result.requestName || result.instruction?.requestName}
                            </span>
                            {result.error && (
                                <span className="text-red-600 ml-2">: {result.error}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
});

ExecuteRequestsButton.displayName = 'ExecuteRequestsButton';

export default ExecuteRequestsButton;

