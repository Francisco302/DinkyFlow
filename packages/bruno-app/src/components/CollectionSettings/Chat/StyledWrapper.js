import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .chat-main-layout {
    display: flex;
    flex-direction: row;
    height: 100%;
    overflow: hidden;
  }

  .chat-left-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow: hidden;
  }

  .chat-right-panel {
    display: flex;
    flex-direction: column;
    width: 400px;
    min-width: 350px;
    max-width: 50%;
    height: 100%;
    overflow: hidden;
    border-left: 1px solid ${(props) => props.theme.border};
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .chat-input-container {
    border-top: 1px solid ${(props) => props.theme.border};
    padding: 1rem;
    background-color: ${(props) => props.theme.bg};
  }

  .provider-selector {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border};
  }

  .message {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: ${(props) => props.theme.bg};

    &.user {
      background-color: ${(props) => props.theme.colors.primary}15;
    }

    &.assistant {
      background-color: ${(props) => props.theme.bg};
      border: 1px solid ${(props) => props.theme.border};
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;

      &.user {
        background-color: ${(props) => props.theme.colors.primary};
        color: white;
      }

      &.assistant {
        background-color: ${(props) => props.theme.colors.text.muted};
        color: white;
      }
    }

    .message-content {
      flex: 1;
      min-width: 0;

      .message-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        line-height: 1.6;
        color: ${(props) => props.theme.colors.text.primary};
      }

      .message-time {
        font-size: 0.75rem;
        color: ${(props) => props.theme.colors.text.muted};
        margin-top: 0.5rem;
      }

      details {
        summary {
          color: ${(props) => props.theme.colors.text.muted};
          transition: color 0.2s;

          &:hover {
            color: ${(props) => props.theme.colors.primary};
          }
        }

        pre {
          background-color: ${(props) => props.theme.input.bg};
          border: 1px solid ${(props) => props.theme.border};
          color: ${(props) => props.theme.colors.text.primary};
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          line-height: 1.4;
        }
      }
    }
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: 0.875rem;
    padding: 0.75rem;

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid ${(props) => props.theme.border};
      border-top-color: ${(props) => props.theme.colors.primary};
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;

    textarea {
      flex: 1;
      min-height: 60px;
      max-height: 200px;
      padding: 0.75rem;
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 0.5rem;
      background-color: ${(props) => props.theme.input.bg};
      color: ${(props) => props.theme.colors.text.primary};
      font-family: inherit;
      font-size: 0.875rem;
      resize: none;
      outline: none;

      &:focus {
        border-color: ${(props) => props.theme.colors.primary};
      }

      &::placeholder {
        color: ${(props) => props.theme.colors.text.muted};
      }
    }

    button {
      padding: 0.75rem 1.5rem;
      background-color: ${(props) => props.theme.colors.primary};
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: opacity 0.2s;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

export default StyledWrapper;

