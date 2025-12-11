import React from 'react';
import get from 'lodash/get';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import { savePreferences } from 'providers/ReduxStore/slices/app';
import StyledWrapper from './StyledWrapper';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

const AI = ({ close }) => {
  const preferences = useSelector((state) => state.app.preferences);
  const dispatch = useDispatch();

  const preferencesSchema = Yup.object().shape({
    geminiApiKey: Yup.string().max(2048).nullable(),
    chatGptApiKey: Yup.string().max(2048).nullable(),
    groqApiKey: Yup.string().max(2048).nullable()
  });

  const formik = useFormik({
    initialValues: {
      geminiApiKey: get(preferences, 'ai.geminiApiKey', ''),
      chatGptApiKey: get(preferences, 'ai.chatGptApiKey', ''),
      groqApiKey: get(preferences, 'ai.groqApiKey', '')
    },
    validationSchema: preferencesSchema,
    onSubmit: async (values) => {
      try {
        const newPreferences = await preferencesSchema.validate(values, { abortEarly: true });
        handleSave(newPreferences);
      } catch (error) {
        console.error('Preferences validation error:', error.message);
      }
    }
  });

  const handleSave = (newPreferences) => {
    dispatch(
      savePreferences({
        ...preferences,
        ai: {
          geminiApiKey: newPreferences.geminiApiKey || '',
          chatGptApiKey: newPreferences.chatGptApiKey || '',
          groqApiKey: newPreferences.groqApiKey || ''
        }
      }))
      .then(() => {
        toast.success('AI preferences saved successfully');
        close();
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to update AI preferences');
      });
  };

  return (
    <StyledWrapper>
      <form className="bruno-form" onSubmit={formik.handleSubmit}>
        <div className="flex flex-col mt-6">
          <label className="block select-none" htmlFor="geminiApiKey">
            Gemini API Key
          </label>
          <input
            type="password"
            name="geminiApiKey"
            id="geminiApiKey"
            className="block textbox mt-2 w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.geminiApiKey || ''}
            placeholder="Enter your Gemini API key"
          />
          <div className="mt-1 text-sm text-gray-500">
            Your API key will be stored securely and used for AI features.
          </div>
        </div>
        {formik.touched.geminiApiKey && formik.errors.geminiApiKey ? (
          <div className="text-red-500">{formik.errors.geminiApiKey}</div>
        ) : null}

        <div className="flex flex-col mt-6">
          <label className="block select-none" htmlFor="chatGptApiKey">
            ChatGPT API Key
          </label>
          <input
            type="password"
            name="chatGptApiKey"
            id="chatGptApiKey"
            className="block textbox mt-2 w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.chatGptApiKey || ''}
            placeholder="Enter your ChatGPT API key"
          />
          <div className="mt-1 text-sm text-gray-500">
            Your API key will be stored securely and used for AI features.
          </div>
        </div>
        <div className="flex flex-col mt-6">
          <label className="block select-none" htmlFor="groqApiKey">
            Groq API Key
          </label>
          <input
            type="password"
            name="groqApiKey"
            id="groqApiKey"
            className="block textbox mt-2 w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.groqApiKey || ''}
            placeholder="Enter your Groq API key"
          />
          <div className="mt-1 text-sm text-gray-500">
            Your API key will be stored securely and used for AI features.
          </div>
        </div>
        {formik.touched.chatGptApiKey && formik.errors.chatGptApiKey ? (
          <div className="text-red-500">{formik.errors.chatGptApiKey}</div>
        ) : null}
        {formik.touched.groqApiKey && formik.errors.groqApiKey ? (
          <div className="text-red-500">{formik.errors.groqApiKey}</div>
        ) : null}

        <div className="mt-10">
          <button type="submit" className="submit btn btn-sm btn-secondary">
            Save
          </button>
        </div>
      </form>
    </StyledWrapper>
  );
};

export default AI;