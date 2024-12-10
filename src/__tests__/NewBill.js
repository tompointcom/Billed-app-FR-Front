/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {    
    let newBill;
    
    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => JSON.stringify({ email: 'email@test.com' }))
        }
      });
      global.FormData = jest.fn(() => ({
        append: jest.fn()
      }));

      // Initialize NewBill after setting up the DOM
      newBill = new NewBill({
        document, // Pass the global document
        onNavigate: jest.fn(),
        store: null, // or provide your mock store here
        localStorage: window.localStorage
      });
    });

    test("Then the new bill form should be displayed", () => {
      const form = screen.getByTestId('form-new-bill');
      expect(form).toBeTruthy();
    });

    describe("When handling file upload", () => {
      test("Then it should reject other file types", () => {
        // Setup DOM
        document.body.innerHTML = NewBillUI();

        // Mock window.alert
        jest.spyOn(window, 'alert').mockImplementation(() => {});

        // Re-initialize newBill after setting up the DOM
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });

        const mockFile = new File(['document'], 'document.pdf', { type: 'application/pdf' });
        const inputFile = screen.getByTestId('file');

        fireEvent.change(inputFile, {
          target: {
            files: [mockFile],
          },
        });

        expect(window.alert).toHaveBeenCalledWith(
          'Seuls les fichiers avec les extensions jpg, jpeg ou png sont acceptés.'
        );
      });

    });
  });
});
