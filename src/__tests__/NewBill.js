/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html


      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeTruthy()
    })
    test("Then form submit and file change events should be attached", () => {
      document.body.innerHTML = NewBillUI();

      const formNewBill = screen.getByTestId("form-new-bill");
      const fileInput = screen.getByTestId("file");

      const addEventListenerSpy = jest.spyOn(formNewBill, "addEventListener");
      const addEventListenerSpyFile = jest.spyOn(fileInput, "addEventListener");

      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith("submit", expect.any(Function));
      expect(addEventListenerSpyFile).toHaveBeenCalledWith("change", expect.any(Function));
    });
  })

})
