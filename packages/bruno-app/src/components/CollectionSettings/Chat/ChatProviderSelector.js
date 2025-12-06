import React, { useRef, forwardRef } from 'react';
import { IconCaretDown } from '@tabler/icons';
import { useTheme } from 'providers/Theme';
import { useChatConfig } from './hooks/useChatConfig';
import { PROVIDER_CONFIGS, PROVIDER_TYPES } from './providers';
import SingleLineEditor from 'components/SingleLineEditor';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import Dropdown from 'components/Dropdown';

const ChatProviderSelector = ({ collection }) => {
  const { storedTheme } = useTheme();
  const { chatConfig, updateProvider, updateApiKey, updateModel, saveConfig } = useChatConfig(collection);
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(chatConfig.apiKey);
  const providerDropdownRef = useRef();
  const modelDropdownRef = useRef();

  const providerConfig = PROVIDER_CONFIGS[chatConfig.provider] || PROVIDER_CONFIGS[PROVIDER_TYPES.GEMINI];

  const handleProviderChange = (providerType) => {
    updateProvider(providerType);
    // Reset model to default for new provider
    const newProviderConfig = PROVIDER_CONFIGS[providerType];
    if (newProviderConfig) {
      updateModel(newProviderConfig.defaultModel);
    }
  };

  const handleApiKeyChange = (apiKey) => {
    updateApiKey(apiKey);
  };

  const handleModelChange = (model) => {
    updateModel(model);
  };

  const onProviderDropdownCreate = (ref) => (providerDropdownRef.current = ref);
  const onModelDropdownCreate = (ref) => (modelDropdownRef.current = ref);

  const ProviderIcon = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between auth-type-label select-none cursor-pointer">
        <span>{providerConfig.displayName}</span>
        <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  const ModelIcon = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between auth-type-label select-none cursor-pointer">
        <span>{chatConfig.model || providerConfig.defaultModel}</span>
        <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  const providerOptions = Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
    value: key,
    label: config.displayName
  }));

  const modelOptions = (providerConfig.models || []).map((model) => ({
    value: model,
    label: model
  }));

  const isApiKeyConfigured = chatConfig.apiKey && chatConfig.apiKey.trim() !== '';

  return (
    <div className="provider-selector">
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-2">AI Provider</label>
            <div className="inline-flex items-center cursor-pointer">
              <Dropdown onCreate={onProviderDropdownCreate} icon={<ProviderIcon />} placement="bottom-end">
                {providerOptions.map((option) => (
                  <div
                    key={option.value}
                    className="dropdown-item"
                    onClick={() => {
                      providerDropdownRef.current?.hide();
                      handleProviderChange(option.value);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </Dropdown>
            </div>
          </div>

          {modelOptions.length > 0 && (
            <div className="flex-1">
              <label className="block font-medium mb-2">Model</label>
              <div className="inline-flex items-center cursor-pointer">
                <Dropdown onCreate={onModelDropdownCreate} icon={<ModelIcon />} placement="bottom-end">
                  {modelOptions.map((option) => (
                    <div
                      key={option.value}
                      className="dropdown-item"
                      onClick={() => {
                        modelDropdownRef.current?.hide();
                        handleModelChange(option.value);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </Dropdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isApiKeyConfigured && (
        <div className="mb-4">
          <label className="block font-medium mb-2">API Key</label>
          <div className="text-red-500 text-sm mb-2">
            API key aún no está configurada para {providerConfig.displayName}. Por favor, configúrala en Preferences → AI o ingrésala aquí.
          </div>
          <div className="single-line-editor-wrapper flex items-center">
            <SingleLineEditor
              value={chatConfig.apiKey}
              theme={storedTheme}
              onSave={saveConfig}
              onChange={handleApiKeyChange}
              collection={collection}
              isSecret={true}
              placeholder={providerConfig.apiKeyPlaceholder}
            />
            {showWarning && <SensitiveFieldWarning fieldName="chat-api-key" warningMessage={warningMessage} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatProviderSelector;

